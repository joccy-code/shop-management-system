import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardReport } from "@/features/reports/api";
import { HomePage } from "./HomePage";

vi.mock("@/features/reports/api", () => ({
  fetchDashboard: vi.fn(),
}));

import { fetchDashboard } from "@/features/reports/api";

const dashboard: DashboardReport = {
  currency: "ETB",
  timezone: "Africa/Addis_Ababa",
  period: { from: "2026-10-01", to: "2026-10-15" },
  salesToday: "250.00",
  salesThisMonth: "1500.00",
  expensesToday: "40.00",
  collectedInPeriod: "1000.00",
  revenueInPeriod: "1500.00",
  estimatedGrossProfit: "400.00",
  estimatedNetProfit: "360.00",
  expensesInPeriod: "40.00",
  outstandingCredit: "100.00",
  productCount: 8,
  lowStockCount: 2,
  recentSales: [
    {
      id: "s1",
      receiptNumber: "SM-000002",
      status: "COMPLETED",
      total: "100.00",
      amountPaid: "100.00",
      outstandingBalance: "0.00",
      soldAt: "2026-10-15T12:27:00.000Z",
      customerName: "Hanna Tesfaye",
    },
  ],
  salesTrend: [
    { date: "2026-10-14", total: "0.00", count: 0 },
    { date: "2026-10-15", total: "250.00", count: 1 },
  ],
  profitNote: "Estimated.",
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("puts today's takings and the main shop actions first", async () => {
    vi.mocked(fetchDashboard).mockResolvedValue(dashboard);
    renderPage();

    expect((await screen.findAllByText(/250\.00/)).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Record a sale" })).toHaveAttribute("href", "/sales");
    expect(screen.getByRole("link", { name: "Record an expense" })).toHaveAttribute(
      "href",
      "/expenses",
    );
    expect(screen.getByRole("link", { name: /Outstanding credit/ })).toHaveAttribute(
      "href",
      "/customers",
    );
    expect(screen.getByRole("link", { name: /Low stock/ })).toHaveAttribute("href", "/products");
    expect(screen.getByText(/Hanna Tesfaye/)).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
  });

  it("shows the empty hint when there are no sales yet", async () => {
    vi.mocked(fetchDashboard).mockResolvedValue({
      ...dashboard,
      salesToday: "0.00",
      recentSales: [],
      salesTrend: [{ date: "2026-10-15", total: "0.00", count: 0 }],
    });
    renderPage();

    expect(await screen.findByText(/No sales or expenses yet/)).toBeInTheDocument();
    expect(screen.getByText(/No sales in the last 14 days/)).toBeInTheDocument();
  });
});
