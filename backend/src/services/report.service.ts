import type { Prisma } from "@prisma/client";
import { AppError } from "../lib/app-error.js";
import {
  addCalendarDays,
  calendarDay,
  eachDay,
  startOfZonedDay,
  startOfZonedMonth,
  zonedRange,
} from "../lib/dates.js";
import { Decimal, multiplyMoney } from "../lib/money.js";
import { prisma } from "../lib/prisma.js";
import type { ReportRangeQuery } from "../schemas/report.schema.js";

const PROFIT_NOTE =
  "Estimated gross profit is selling price minus unit cost on non-voided sales, including credit sales, because the goods left the shop. Collected cash is only the amount actually paid. Estimated net profit subtracts recorded operating expenses and excludes taxes, inventory adjustments, unpaid bills, and voided records. It is not formal accounting profit.";

const INVENTORY_NOTE =
  "Stock cost value uses the current unit cost. Potential selling value uses the current selling price. Neither figure is a sale.";

type ShopContext = {
  shopId: string;
  timeZone: string;
  currency: string;
};

async function shopContext(shopId: string): Promise<ShopContext> {
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
  return { shopId, timeZone: shop.timezone, currency: shop.currency };
}

function resolveRange(query: ReportRangeQuery, timeZone: string, now = new Date()) {
  const today = calendarDay(now, timeZone);
  const from = query.from ?? today;
  const to = query.to ?? today;
  try {
    return zonedRange(from, to, timeZone);
  } catch {
    throw new AppError(400, "INVALID_RANGE", "Choose a valid date range.");
  }
}

const activeSaleWhere = (
  shopId: string,
  start: Date,
  end: Date,
): Prisma.SaleWhereInput => ({
  shopId,
  status: { not: "VOIDED" },
  soldAt: { gte: start, lt: end },
});

async function sumSales(where: Prisma.SaleWhereInput) {
  const sales = await prisma.sale.findMany({
    where,
    include: { items: true },
  });

  let revenue = new Decimal(0);
  let collected = new Decimal(0);
  let outstanding = new Decimal(0);
  let grossProfit = new Decimal(0);

  for (const sale of sales) {
    revenue = revenue.plus(sale.total);
    collected = collected.plus(sale.amountPaid);
    outstanding = outstanding.plus(sale.outstandingBalance);
    for (const item of sale.items) {
      const unitProfit = new Decimal(item.unitPriceSnapshot).minus(
        item.unitCostSnapshot,
      );
      grossProfit = grossProfit.plus(multiplyMoney(unitProfit, item.quantity));
    }
  }

  return {
    count: sales.length,
    revenue: revenue.toFixed(2),
    collected: collected.toFixed(2),
    outstanding: outstanding.toFixed(2),
    grossProfit: grossProfit.toFixed(2),
    sales,
  };
}

async function sumExpenses(shopId: string, startDay: string, endDay: string) {
  const expenses = await prisma.expense.findMany({
    where: {
      shopId,
      status: "RECORDED",
      expenseDate: {
        gte: new Date(`${startDay}T00:00:00.000Z`),
        lte: new Date(`${endDay}T00:00:00.000Z`),
      },
    },
  });

  const total = expenses.reduce(
    (sum, expense) => sum.plus(expense.amount),
    new Decimal(0),
  );

  return { expenses, total: total.toFixed(2) };
}

export async function dashboardReport(shopId: string, query: ReportRangeQuery) {
  const context = await shopContext(shopId);
  const now = new Date();
  const today = calendarDay(now, context.timeZone);
  const todayStart = startOfZonedDay(today, context.timeZone);
  const todayEnd = startOfZonedDay(addCalendarDays(today, 1), context.timeZone);
  const monthStart = startOfZonedMonth(today, context.timeZone);
  const range = resolveRange(query, context.timeZone, now);

  const [todaySales, monthSales, periodSales, todayExpenses, periodExpenses, products, recent, openCredit] =
    await Promise.all([
      sumSales(activeSaleWhere(context.shopId, todayStart, todayEnd)),
      sumSales(activeSaleWhere(context.shopId, monthStart, todayEnd)),
      sumSales(activeSaleWhere(context.shopId, range.start, range.end)),
      sumExpenses(context.shopId, today, today),
      sumExpenses(context.shopId, range.from, range.to),
      prisma.product.findMany({
        where: { shopId: context.shopId, status: "ACTIVE" },
      }),
      prisma.sale.findMany({
        where: { shopId: context.shopId },
        orderBy: { soldAt: "desc" },
        take: 5,
        include: { customer: true },
      }),
      prisma.sale.aggregate({
        where: {
          shopId: context.shopId,
          status: { in: ["UNPAID", "PARTIALLY_PAID"] },
        },
        _sum: { outstandingBalance: true },
      }),
    ]);

  const lowStock = products.filter((product) =>
    new Decimal(product.stockQuantity).lessThanOrEqualTo(product.lowStockThreshold),
  );

  const trendDays = eachDay(range.from, range.to);
  const salesTrend = trendDays.map((day) => {
    const bucket = periodSales.sales.filter(
      (sale) => calendarDay(sale.soldAt, context.timeZone) === day,
    );
    const total = bucket.reduce(
      (sum, sale) => sum.plus(sale.total),
      new Decimal(0),
    );
    return { date: day, total: total.toFixed(2), count: bucket.length };
  });

  const gross = new Decimal(periodSales.grossProfit);
  const expenses = new Decimal(periodExpenses.total);

  return {
    currency: context.currency,
    timezone: context.timeZone,
    period: { from: range.from, to: range.to },
    salesToday: todaySales.revenue,
    salesThisMonth: monthSales.revenue,
    expensesToday: todayExpenses.total,
    collectedInPeriod: periodSales.collected,
    revenueInPeriod: periodSales.revenue,
    estimatedGrossProfit: gross.toFixed(2),
    estimatedNetProfit: gross.minus(expenses).toFixed(2),
    expensesInPeriod: periodExpenses.total,
    outstandingCredit: new Decimal(
      openCredit._sum.outstandingBalance ?? 0,
    ).toFixed(2),
    productCount: products.length,
    lowStockCount: lowStock.length,
    recentSales: recent.map((sale) => ({
      id: sale.id,
      receiptNumber: sale.receiptNumber,
      status: sale.status,
      total: new Decimal(sale.total).toFixed(2),
      amountPaid: new Decimal(sale.amountPaid).toFixed(2),
      outstandingBalance: new Decimal(sale.outstandingBalance).toFixed(2),
      soldAt: sale.soldAt.toISOString(),
      customerName: sale.customer?.name ?? null,
    })),
    salesTrend,
    profitNote: PROFIT_NOTE,
  };
}

export async function salesReport(shopId: string, query: ReportRangeQuery) {
  const context = await shopContext(shopId);
  const range = resolveRange(query, context.timeZone);
  const summary = await sumSales(
    activeSaleWhere(context.shopId, range.start, range.end),
  );

  const byDay = eachDay(range.from, range.to).map((day) => {
    const bucket = summary.sales.filter(
      (sale) => calendarDay(sale.soldAt, context.timeZone) === day,
    );
    return {
      date: day,
      count: bucket.length,
      revenue: bucket
        .reduce((sum, sale) => sum.plus(sale.total), new Decimal(0))
        .toFixed(2),
      collected: bucket
        .reduce((sum, sale) => sum.plus(sale.amountPaid), new Decimal(0))
        .toFixed(2),
    };
  });

  const productTotals = new Map<
    string,
    { name: string; quantity: Decimal; revenue: Decimal }
  >();
  for (const sale of summary.sales) {
    for (const item of sale.items) {
      const current = productTotals.get(item.productId) ?? {
        name: item.productNameSnapshot,
        quantity: new Decimal(0),
        revenue: new Decimal(0),
      };
      current.quantity = current.quantity.plus(item.quantity);
      current.revenue = current.revenue.plus(item.lineTotal);
      productTotals.set(item.productId, current);
    }
  }

  const bestSellers = [...productTotals.entries()]
    .map(([productId, value]) => ({
      productId,
      name: value.name,
      quantity: value.quantity.toFixed(3),
      revenue: value.revenue.toFixed(2),
    }))
    .sort((left, right) => Number(right.quantity) - Number(left.quantity))
    .slice(0, 10);

  return {
    currency: context.currency,
    timezone: context.timeZone,
    period: { from: range.from, to: range.to },
    count: summary.count,
    revenue: summary.revenue,
    collected: summary.collected,
    outstanding: summary.outstanding,
    estimatedGrossProfit: summary.grossProfit,
    byDay,
    bestSellers,
    profitNote: PROFIT_NOTE,
  };
}

export async function expensesReport(shopId: string, query: ReportRangeQuery) {
  const context = await shopContext(shopId);
  const range = resolveRange(query, context.timeZone);
  const { expenses, total } = await sumExpenses(
    context.shopId,
    range.from,
    range.to,
  );

  const byCategoryMap = new Map<string, Decimal>();
  for (const expense of expenses) {
    byCategoryMap.set(
      expense.category,
      (byCategoryMap.get(expense.category) ?? new Decimal(0)).plus(expense.amount),
    );
  }

  return {
    currency: context.currency,
    timezone: context.timeZone,
    period: { from: range.from, to: range.to },
    total,
    byCategory: [...byCategoryMap.entries()]
      .map(([category, amount]) => ({ category, amount: amount.toFixed(2) }))
      .sort((left, right) => left.category.localeCompare(right.category)),
    count: expenses.length,
  };
}

export async function inventoryReport(shopId: string) {
  const context = await shopContext(shopId);
  const products = await prisma.product.findMany({
    where: { shopId, status: "ACTIVE" },
    include: { category: true },
    orderBy: { name: "asc" },
  });

  let costValue = new Decimal(0);
  let retailValue = new Decimal(0);

  const items = products.map((product) => {
    const quantity = new Decimal(product.stockQuantity);
    const cost = multiplyMoney(product.unitCost, quantity);
    const retail = multiplyMoney(product.sellingPrice, quantity);
    costValue = costValue.plus(cost);
    retailValue = retailValue.plus(retail);
    const low =
      quantity.lessThanOrEqualTo(product.lowStockThreshold);
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      categoryName: product.category?.name ?? null,
      stockQuantity: quantity.toFixed(3),
      unitCost: new Decimal(product.unitCost).toFixed(2),
      sellingPrice: new Decimal(product.sellingPrice).toFixed(2),
      costValue: cost.toFixed(2),
      retailValue: retail.toFixed(2),
      lowStock: low,
    };
  });

  return {
    currency: context.currency,
    productCount: items.length,
    stockCostValue: costValue.toFixed(2),
    potentialSellingValue: retailValue.toFixed(2),
    inventoryNote: INVENTORY_NOTE,
    lowStock: items.filter((item) => item.lowStock),
    items,
  };
}

export async function customerBalanceReport(shopId: string) {
  const context = await shopContext(shopId);
  const sales = await prisma.sale.findMany({
    where: {
      shopId,
      status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      customerId: { not: null },
    },
    include: { customer: true },
  });

  const grouped = new Map<
    string,
    { name: string; phone: string | null; outstanding: Decimal; openSaleCount: number }
  >();

  for (const sale of sales) {
    if (!sale.customer) {
      continue;
    }
    const current = grouped.get(sale.customer.id) ?? {
      name: sale.customer.name,
      phone: sale.customer.phone,
      outstanding: new Decimal(0),
      openSaleCount: 0,
    };
    current.outstanding = current.outstanding.plus(sale.outstandingBalance);
    current.openSaleCount += 1;
    grouped.set(sale.customer.id, current);
  }

  const customers = [...grouped.entries()]
    .map(([id, value]) => ({
      id,
      name: value.name,
      phone: value.phone,
      outstanding: value.outstanding.toFixed(2),
      openSaleCount: value.openSaleCount,
    }))
    .sort((left, right) => Number(right.outstanding) - Number(left.outstanding));

  const totalOutstanding = customers.reduce(
    (sum, customer) => sum.plus(customer.outstanding),
    new Decimal(0),
  );

  return {
    currency: context.currency,
    timezone: context.timeZone,
    totalOutstanding: totalOutstanding.toFixed(2),
    customers,
    note: "Outstanding balance is the unpaid portion of non-voided credit sales. Repayments reduce it. Unpaid sales are not counted as collected cash.",
  };
}
