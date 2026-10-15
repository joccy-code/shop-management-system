import type { Customer, Prisma } from "@prisma/client";
import { AppError } from "../lib/app-error.js";
import { Decimal } from "../lib/money.js";
import { pageArgs, type Page } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import type {
  CreateCustomerInput,
  CreateRepaymentInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "../schemas/customer.schema.js";
import { getSaleOrThrow, type SaleWithRelations } from "./sale.service.js";

const OPEN_SALE_STATUSES = ["UNPAID", "PARTIALLY_PAID"] as const;

export async function createCustomer(
  shopId: string,
  input: CreateCustomerInput,
): Promise<Customer> {
  return prisma.customer.create({
    data: {
      shopId,
      name: input.name,
      phone: input.phone ?? null,
      notes: input.notes ?? null,
    },
  });
}

export async function updateCustomer(
  shopId: string,
  customerId: string,
  input: UpdateCustomerInput,
): Promise<Customer> {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, shopId, removedAt: null },
  });

  if (!existing) {
    throw new AppError(404, "NOT_FOUND", "Customer not found.");
  }

  return prisma.customer.update({
    where: { id: existing.id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });
}

export async function listCustomers(
  shopId: string,
  query: ListCustomersQuery,
): Promise<Page<Customer & { outstandingBalance: string }>> {
  const where: Prisma.CustomerWhereInput = {
    shopId,
    removedAt: null,
    ...(query.search
      ? {
          OR: [
            { name: { contains: query.search, mode: "insensitive" } },
            { phone: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, customers] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      ...pageArgs(query),
    }),
  ]);

  const balances = await outstandingByCustomer(
    shopId,
    customers.map((customer) => customer.id),
  );

  return {
    items: customers.map((customer) => ({
      ...customer,
      outstandingBalance: balances.get(customer.id) ?? "0.00",
    })),
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

async function outstandingByCustomer(
  shopId: string,
  customerIds: string[],
): Promise<Map<string, string>> {
  if (customerIds.length === 0) {
    return new Map();
  }

  const grouped = await prisma.sale.groupBy({
    by: ["customerId"],
    where: {
      shopId,
      customerId: { in: customerIds },
      status: { in: [...OPEN_SALE_STATUSES] },
    },
    _sum: { outstandingBalance: true },
  });

  return new Map(
    grouped.map((row) => [
      row.customerId ?? "",
      new Decimal(row._sum.outstandingBalance ?? 0).toFixed(2),
    ]),
  );
}

export async function getCustomerDetail(shopId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId, removedAt: null },
  });

  if (!customer) {
    throw new AppError(404, "NOT_FOUND", "Customer not found.");
  }

  const [sales, repayments, balance] = await Promise.all([
    prisma.sale.findMany({
      where: { shopId, customerId },
      include: { items: true, payments: true, customer: true },
      orderBy: { soldAt: "desc" },
      take: 50,
    }),
    prisma.customerRepayment.findMany({
      where: { shopId, customerId },
      orderBy: { paidAt: "desc" },
      take: 50,
    }),
    outstandingByCustomer(shopId, [customerId]),
  ]);

  return {
    customer,
    outstandingBalance: balance.get(customerId) ?? "0.00",
    sales,
    repayments,
  };
}

export async function recordRepayment(
  shopId: string,
  customerId: string,
  input: CreateRepaymentInput,
): Promise<{ sale: SaleWithRelations; outstandingBalance: string }> {
  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findFirst({
      where: { id: customerId, shopId, removedAt: null },
    });
    if (!customer) {
      throw new AppError(404, "NOT_FOUND", "Customer not found.");
    }

    const sale = await tx.sale.findFirst({
      where: { id: input.saleId, shopId, customerId },
    });

    if (!sale) {
      throw new AppError(
        404,
        "NOT_FOUND",
        "That credit sale was not found for this customer.",
      );
    }

    if (sale.status === "VOIDED" || sale.status === "COMPLETED") {
      throw new AppError(
        409,
        "SALE_CLOSED",
        "This sale does not have an outstanding balance.",
      );
    }

    const amount = new Decimal(input.amount);
    const outstanding = new Decimal(sale.outstandingBalance);
    if (amount.greaterThan(outstanding)) {
      throw new AppError(
        400,
        "REPAYMENT_TOO_LARGE",
        "Repayment cannot be more than the outstanding balance.",
      );
    }

    const nextOutstanding = outstanding.minus(amount);
    const nextPaid = new Decimal(sale.amountPaid).plus(amount);

    await tx.customerRepayment.create({
      data: {
        shopId,
        customerId,
        saleId: sale.id,
        amount: amount.toFixed(2),
        method: input.method,
        note: input.note ?? null,
      },
    });

    await tx.payment.create({
      data: {
        shopId,
        saleId: sale.id,
        method: input.method,
        amount: amount.toFixed(2),
        reference: input.note ?? null,
      },
    });

    await tx.sale.update({
      where: { id: sale.id },
      data: {
        amountPaid: nextPaid.toFixed(2),
        outstandingBalance: nextOutstanding.toFixed(2),
        status: nextOutstanding.isZero() ? "COMPLETED" : "PARTIALLY_PAID",
      },
    });
  });

  const sale = await getSaleOrThrow(shopId, input.saleId);
  const balance = await outstandingByCustomer(shopId, [customerId]);
  return {
    sale,
    outstandingBalance: balance.get(customerId) ?? "0.00",
  };
}

export async function removeCustomer(shopId: string, customerId: string): Promise<void> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId, removedAt: null },
  });

  if (!customer) {
    throw new AppError(404, "NOT_FOUND", "Customer not found.");
  }

  const balances = await outstandingByCustomer(shopId, [customerId]);
  const outstanding = new Decimal(balances.get(customerId) ?? 0);
  if (outstanding.greaterThan(0)) {
    throw new AppError(
      409,
      "CUSTOMER_HAS_BALANCE",
      "This customer still owes money. Record the repayment before removing them.",
    );
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data: { removedAt: new Date() },
  });
}
