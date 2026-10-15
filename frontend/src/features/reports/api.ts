import { api } from "@/lib/api";

export type DashboardReport = {
  currency: string;
  timezone: string;
  period: { from: string; to: string };
  salesToday: string;
  salesThisMonth: string;
  expensesToday: string;
  collectedInPeriod: string;
  revenueInPeriod: string;
  estimatedGrossProfit: string;
  estimatedNetProfit: string;
  expensesInPeriod: string;
  outstandingCredit: string;
  productCount: number;
  lowStockCount: number;
  recentSales: Array<{
    id: string;
    receiptNumber: string;
    status: string;
    total: string;
    amountPaid: string;
    outstandingBalance: string;
    soldAt: string;
    customerName: string | null;
  }>;
  salesTrend: Array<{ date: string; total: string; count: number }>;
  profitNote: string;
};

export type SalesReport = {
  period: { from: string; to: string };
  count: number;
  revenue: string;
  collected: string;
  outstanding: string;
  estimatedGrossProfit: string;
  bestSellers: Array<{
    productId: string;
    name: string;
    quantity: string;
    revenue: string;
  }>;
  profitNote: string;
};

export type ExpensesReport = {
  total: string;
  count: number;
  byCategory: Array<{ category: string; amount: string }>;
};

export type InventoryReport = {
  productCount: number;
  stockCostValue: string;
  potentialSellingValue: string;
  inventoryNote: string;
  lowStock: Array<{
    id: string;
    name: string;
    stockQuantity: string;
    lowStock: boolean;
  }>;
};

export type CustomerBalanceReport = {
  totalOutstanding: string;
  note: string;
  customers: Array<{
    id: string;
    name: string;
    phone: string | null;
    outstanding: string;
    openSaleCount: number;
  }>;
};

function rangeQuery(from: string, to: string): string {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function fetchDashboard(from: string, to: string) {
  return api.get<DashboardReport>(`/reports/dashboard${rangeQuery(from, to)}`);
}

export function fetchSalesReport(from: string, to: string) {
  return api.get<SalesReport>(`/reports/sales${rangeQuery(from, to)}`);
}

export function fetchExpensesReport(from: string, to: string) {
  return api.get<ExpensesReport>(`/reports/expenses${rangeQuery(from, to)}`);
}

export function fetchInventoryReport() {
  return api.get<InventoryReport>("/reports/inventory");
}

export function fetchCustomerBalances() {
  return api.get<CustomerBalanceReport>("/reports/customer-balances");
}
