import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CustomerBalanceReport,
  ExpensesReport,
  InventoryReport,
  SalesReport,
} from "@/features/reports/api";
import { ReportsPage } from "./ReportsPage";

vi.mock("@/features/reports/api", () => ({
  fetchSalesReport: vi.fn(),
  fetchExpensesReport: vi.fn(),
  fetchInventoryReport: vi.fn(),
  fetchCustomerBalances: vi.fn(),
}));

import {
  fetchCustomerBalances,
  fetchExpensesReport,
  fetchInventoryReport,
  fetchSalesReport,
} from "@/features/reports/api";

const sales: SalesReport = {
  period: { from: "2026-10-01", to: "2026-10-03" },
  count: 2,
  revenue: "1500.00",
  collected: "1000.00",
  outstanding: "500.00",
  estimatedGrossProfit: "400.00",
  byDay: [
    { date: "2026-10-01", count: 1, revenue: "1000.00", collected: "700.00" },
    { date: "2026-10-02", count: 0, revenue: "0.00", collected: "0.00" },
    { date: "2026-10-03", count: 1, revenue: "500.00", collected: "300.00" },
  ],
  bestSellers: [
    { productId: "p1", name: "Rice 1kg", quantity: "4.000", revenue: "900.00" },
    { productId: "p2", name: "Cooking oil", quantity: "2.000", revenue: "600.00" },
  ],
  profitNote: "Estimated gross profit is an estimate.",
};

const expenses: ExpensesReport = {
  total: "250.00",
  count: 2,
  byCategory: [
    { category: "rent", amount: "200.00" },
    { category: "transport", amount: "50.00" },
  ],
};

const inventory: InventoryReport = {
  productCount: 3,
  stockCostValue: "700.00",
  potentialSellingValue: "1100.00",
  inventoryNote: "Stock cost value uses the current unit cost.",
  lowStock: [{ id: "p3", name: "Sugar", stockQuantity: "1.000", lowStock: true }],
  items: [
    {
      id: "p1",
      name: "Rice 1kg",
      sku: null,
      categoryName: "Groceries",
      stockQuantity: "8.000",
      unitCost: "50.00",
      sellingPrice: "80.00",
      costValue: "400.00",
      retailValue: "640.00",
      lowStock: false,
    },
    {
      id: "p2",
      name: "Cooking oil",
      sku: null,
      categoryName: "Groceries",
      stockQuantity: "5.000",
      unitCost: "40.00",
      sellingPrice: "70.00",
      costValue: "200.00",
      retailValue: "350.00",
      lowStock: false,
    },
    {
      id: "p3",
      name: "Sugar",
      sku: null,
      categoryName: "Household",
      stockQuantity: "1.000",
      unitCost: "100.00",
      sellingPrice: "110.00",
      costValue: "100.00",
      retailValue: "110.00",
      lowStock: true,
    },
  ],
};

const balances: CustomerBalanceReport = {
  totalOutstanding: "500.00",
  note: "Outstanding balance is the unpaid portion.",
  customers: [
    {
      id: "c1",
      name: "Abebe",
      phone: null,
      outstanding: "500.00",
      openSaleCount: 1,
    },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportsPage />
    </QueryClientProvider>,
  );
}

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.mocked(fetchSalesReport).mockResolvedValue(sales);
    vi.mocked(fetchExpensesReport).mockResolvedValue(expenses);
    vi.mocked(fetchInventoryReport).mockResolvedValue(inventory);
    vi.mocked(fetchCustomerBalances).mockResolvedValue(balances);
  });

  it("renders charts for sales, expenses, inventory, and balances", async () => {
    renderPage();

    expect(await screen.findByRole("img", { name: /Daily sales/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Collected cash/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Rent/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Groceries/ })).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Best-selling products" })).toBeInTheDocument();
    expect(screen.getByText("Rice 1kg")).toBeInTheDocument();
    expect(screen.getByText("Cooking oil")).toBeInTheDocument();
    expect(screen.getByText("Sugar")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Customer balances" })).toBeInTheDocument();
    expect(screen.getByText("Abebe")).toBeInTheDocument();
    expect(screen.getByText("2026-10-03")).toBeInTheDocument();
  });

  it("highlights an expense slice from the legend", async () => {
    const user = userEvent.setup();
    renderPage();

    const rent = await screen.findByRole("button", { name: /Rent/ });
    await user.hover(rent);

    await waitFor(() => {
      expect(rent).toHaveClass("bg-ink-100");
    });
  });

  it("shows empty chart messages when a period has no activity", async () => {
    vi.mocked(fetchSalesReport).mockResolvedValue({
      ...sales,
      revenue: "0.00",
      collected: "0.00",
      outstanding: "0.00",
      estimatedGrossProfit: "0.00",
      byDay: [{ date: "2026-10-01", count: 0, revenue: "0.00", collected: "0.00" }],
      bestSellers: [],
    });
    vi.mocked(fetchExpensesReport).mockResolvedValue({
      total: "0.00",
      count: 0,
      byCategory: [],
    });
    vi.mocked(fetchInventoryReport).mockResolvedValue({
      ...inventory,
      stockCostValue: "0.00",
      potentialSellingValue: "0.00",
      lowStock: [],
      items: [],
    });
    vi.mocked(fetchCustomerBalances).mockResolvedValue({
      totalOutstanding: "0.00",
      note: balances.note,
      customers: [],
    });

    renderPage();

    expect(await screen.findAllByText("No sales in this period.")).not.toHaveLength(0);
    expect(screen.getByText("No expenses in this period.")).toBeInTheDocument();
    expect(screen.getByText("No stock value to chart yet.")).toBeInTheDocument();
    expect(screen.getByText("No products are at or below their low-stock level.")).toBeInTheDocument();
    expect(screen.getByText("No customers have an outstanding balance.")).toBeInTheDocument();
  });
});
