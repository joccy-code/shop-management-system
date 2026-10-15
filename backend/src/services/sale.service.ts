import { Prisma } from "@prisma/client";
import { AppError } from "../lib/app-error.js";
import {
  calendarDay,
  startOfZonedDay,
  addCalendarDays,
} from "../lib/dates.js";
import { loadEnv } from "../lib/env.js";
import { Decimal, multiplyMoney } from "../lib/money.js";
import { pageArgs, type Page } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import type {
  CreateSaleInput,
  ListSalesQuery,
  VoidSaleInput,
} from "../schemas/sale.schema.js";

const saleInclude = {
  items: { orderBy: { id: "asc" as const } },
  payments: { orderBy: { paidAt: "asc" as const } },
  customer: true,
} satisfies Prisma.SaleInclude;

export type SaleWithRelations = Prisma.SaleGetPayload<{
  include: typeof saleInclude;
}>;

type LockedProduct = {
  id: string;
  name: string;
  selling_price: Prisma.Decimal | string;
  unit_cost: Prisma.Decimal | string;
  stock_quantity: Prisma.Decimal | string;
  status: "ACTIVE" | "ARCHIVED";
};

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

async function findByIdempotencyKey(
  shopId: string,
  idempotencyKey: string,
): Promise<SaleWithRelations | null> {
  return prisma.sale.findFirst({
    where: { shopId, idempotencyKey },
    include: saleInclude,
  });
}

export async function createSale(
  shopId: string,
  userId: string,
  input: CreateSaleInput,
  idempotencyKey: string | null,
): Promise<{ sale: SaleWithRelations; replayed: boolean }> {
  if (idempotencyKey) {
    const existing = await findByIdempotencyKey(shopId, idempotencyKey);
    if (existing) {
      return { sale: existing, replayed: true };
    }
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT id FROM shops WHERE id = ${shopId} FOR UPDATE`;

      if (idempotencyKey) {
        const existing = await tx.sale.findFirst({
          where: { shopId, idempotencyKey },
          include: saleInclude,
        });
        if (existing) {
          return { sale: existing, replayed: true };
        }
      }

      const productIds = [
        ...new Set(input.items.map((item) => item.productId)),
      ].sort();

      const locked = await tx.$queryRaw<LockedProduct[]>`
        SELECT id, name, selling_price, unit_cost, stock_quantity, status
        FROM products
        WHERE shop_id = ${shopId}
          AND id IN (${Prisma.join(productIds)})
        ORDER BY id
        FOR UPDATE
      `;

      const byId = new Map(locked.map((product) => [product.id, product]));
      for (const productId of productIds) {
        const product = byId.get(productId);
        if (!product || product.status !== "ACTIVE") {
          throw new AppError(
            400,
            "INVALID_PRODUCT",
            "One of the products is unavailable in this shop.",
          );
        }
      }

      const requested = new Map<string, Decimal>();
      for (const item of input.items) {
        const quantity = new Decimal(item.quantity);
        requested.set(
          item.productId,
          (requested.get(item.productId) ?? new Decimal(0)).plus(quantity),
        );
      }

      for (const [productId, quantity] of requested) {
        const product = byId.get(productId)!;
        if (new Decimal(product.stock_quantity).lessThan(quantity)) {
          throw new AppError(
            409,
            "INSUFFICIENT_STOCK",
            `${product.name} does not have enough stock for this sale.`,
          );
        }
      }

      const lines = input.items.map((item) => {
        const product = byId.get(item.productId)!;
        const quantity = new Decimal(item.quantity);
        const unitPrice = new Decimal(product.selling_price);
        const unitCost = new Decimal(product.unit_cost);
        const lineTotal = multiplyMoney(unitPrice, quantity);
        return { product, quantity, unitPrice, unitCost, lineTotal };
      });

      const subtotal = lines.reduce(
        (total, line) => total.plus(line.lineTotal),
        new Decimal(0),
      );
      const total = subtotal.toDecimalPlaces(2);
      const amountPaid = new Decimal(input.amountPaid).toDecimalPlaces(2);

      if (amountPaid.greaterThan(total)) {
        throw new AppError(
          400,
          "INVALID_PAYMENT",
          "Amount paid cannot be more than the sale total.",
        );
      }

      const outstanding = total.minus(amountPaid);
      const status = outstanding.isZero()
        ? "COMPLETED"
        : amountPaid.isZero()
          ? "UNPAID"
          : "PARTIALLY_PAID";

      let customerId: string | null = input.customerId ?? null;
      let customerNameSnapshot: string | null = null;
      if (outstanding.greaterThan(0)) {
        if (!customerId) {
          throw new AppError(
            400,
            "CUSTOMER_REQUIRED",
            "Choose a customer when the sale is not fully paid.",
          );
        }
      }

      if (customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: customerId, shopId, removedAt: null },
        });
        if (!customer) {
          throw new AppError(
            400,
            "INVALID_CUSTOMER",
            "Select a customer from this shop.",
          );
        }
        customerNameSnapshot = customer.name;
      } else {
        customerId = null;
      }

      const saleCount = await tx.sale.count({ where: { shopId } });
      const receiptNumber = `SM-${String(saleCount + 1).padStart(6, "0")}`;

      const created = await tx.sale.create({
        data: {
          shopId,
          recordedByUserId: userId,
          customerId,
          customerNameSnapshot,
          receiptNumber,
          status,
          subtotal: subtotal.toFixed(2),
          total: total.toFixed(2),
          amountPaid: amountPaid.toFixed(2),
          outstandingBalance: outstanding.toFixed(2),
          paymentMethod: input.paymentMethod,
          idempotencyKey,
          notes: input.notes ?? null,
          items: {
            create: lines.map((line) => ({
              productId: line.product.id,
              productNameSnapshot: line.product.name,
              unitPriceSnapshot: line.unitPrice.toFixed(2),
              unitCostSnapshot: line.unitCost.toFixed(2),
              quantity: line.quantity.toFixed(3),
              lineTotal: line.lineTotal.toFixed(2),
            })),
          },
          ...(amountPaid.greaterThan(0)
            ? {
                payments: {
                  create: {
                    shopId,
                    method:
                      input.paymentMethod === "CREDIT"
                        ? "CASH"
                        : input.paymentMethod,
                    amount: amountPaid.toFixed(2),
                    reference: input.paymentReference ?? null,
                  },
                },
              }
            : {}),
        },
        include: saleInclude,
      });

      const remaining = new Map(
        locked.map((product) => [
          product.id,
          new Decimal(product.stock_quantity),
        ]),
      );

      for (const line of lines) {
        const next = remaining.get(line.product.id)!.minus(line.quantity);
        remaining.set(line.product.id, next);
        await tx.product.update({
          where: { id: line.product.id },
          data: { stockQuantity: next.toFixed(3) },
        });
        await tx.inventoryMovement.create({
          data: {
            shopId,
            productId: line.product.id,
            type: "SALE",
            quantityChange: line.quantity.negated().toFixed(3),
            quantityAfter: next.toFixed(3),
            reason: `Sale ${receiptNumber}`,
            referenceType: "sale",
            referenceId: created.id,
          },
        });
      }

      return { sale: created, replayed: false };
    });

    return created;
  } catch (error) {
    if (idempotencyKey && isUniqueViolation(error)) {
      const existing = await findByIdempotencyKey(shopId, idempotencyKey);
      if (existing) {
        return { sale: existing, replayed: true };
      }
    }
    throw error;
  }
}

export async function listSales(
  shopId: string,
  query: ListSalesQuery,
): Promise<Page<SaleWithRelations>> {
  const timeZone = loadEnv().APP_TIMEZONE;
  const where: Prisma.SaleWhereInput = {
    shopId,
    ...(query.status ? { status: query.status } : {}),
  };

  if (query.from || query.to) {
    const from = query.from ?? "1970-01-01";
    const to = query.to ?? calendarDay(new Date(), timeZone);
    where.soldAt = {
      gte: startOfZonedDay(from, timeZone),
      lt: startOfZonedDay(addCalendarDays(to, 1), timeZone),
    };
  }

  const [total, items] = await prisma.$transaction([
    prisma.sale.count({ where }),
    prisma.sale.findMany({
      where,
      include: saleInclude,
      orderBy: { soldAt: "desc" },
      ...pageArgs(query),
    }),
  ]);

  return { items, page: query.page, pageSize: query.pageSize, total };
}

export async function getSaleOrThrow(
  shopId: string,
  saleId: string,
): Promise<SaleWithRelations> {
  const sale = await prisma.sale.findFirst({
    where: { id: saleId, shopId },
    include: saleInclude,
  });

  if (!sale) {
    throw new AppError(404, "NOT_FOUND", "Sale not found.");
  }

  return sale;
}

export async function voidSale(
  shopId: string,
  saleId: string,
  input: VoidSaleInput,
): Promise<SaleWithRelations> {
  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, shopId },
      include: { items: true, repayments: true },
    });

    if (!sale) {
      throw new AppError(404, "NOT_FOUND", "Sale not found.");
    }

    if (sale.status === "VOIDED") {
      throw new AppError(409, "ALREADY_VOIDED", "This sale is already voided.");
    }

    if (sale.repayments.length > 0) {
      throw new AppError(
        409,
        "HAS_REPAYMENTS",
        "This sale has repayments. It cannot be voided.",
      );
    }

    const productIds = [...new Set(sale.items.map((item) => item.productId))].sort();
    if (productIds.length > 0) {
      await tx.$queryRaw`
        SELECT id FROM products
        WHERE shop_id = ${shopId} AND id IN (${Prisma.join(productIds)})
        ORDER BY id
        FOR UPDATE
      `;
    }

    const products = await tx.product.findMany({
      where: { shopId, id: { in: productIds } },
    });
    const stock = new Map(
      products.map((product) => [product.id, new Decimal(product.stockQuantity)]),
    );

    for (const item of sale.items) {
      const current = stock.get(item.productId);
      if (current === undefined) {
        throw new AppError(
          409,
          "PRODUCT_MISSING",
          "A product from this sale is no longer available.",
        );
      }
      const next = current.plus(item.quantity);
      stock.set(item.productId, next);
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: next.toFixed(3) },
      });
      await tx.inventoryMovement.create({
        data: {
          shopId,
          productId: item.productId,
          type: "RETURN",
          quantityChange: new Decimal(item.quantity).toFixed(3),
          quantityAfter: next.toFixed(3),
          reason: input.reason ?? `Voided sale ${sale.receiptNumber}`,
          referenceType: "sale",
          referenceId: sale.id,
        },
      });
    }

    await tx.payment.updateMany({
      where: { saleId: sale.id, shopId, status: "RECORDED" },
      data: { status: "VOIDED" },
    });

    return tx.sale.update({
      where: { id: sale.id },
      data: {
        status: "VOIDED",
        voidedAt: new Date(),
        outstandingBalance: "0.00",
      },
      include: saleInclude,
    });
  });
}
