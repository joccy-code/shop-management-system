import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/features/products/types";
import { SalesPage } from "./SalesPage";

vi.mock("@/features/products/api", () => ({
  listProducts: vi.fn(),
}));

vi.mock("@/features/sales/api", () => ({
  listSales: vi.fn(),
  createSale: vi.fn(),
  voidSale: vi.fn(),
}));

vi.mock("@/features/customers/api", () => ({
  listCustomers: vi.fn(),
}));

import { listCustomers } from "@/features/customers/api";
import { listProducts } from "@/features/products/api";
import { createSale, listSales } from "@/features/sales/api";

const product: Product = {
  id: "p1",
  shopId: "s1",
  categoryId: null,
  category: null,
  name: "Rice 1kg",
  sku: null,
  sellingPrice: "100.00",
  unitCost: "70.00",
  stockQuantity: "10.000",
  lowStockThreshold: "2.000",
  unitOfMeasure: "pc",
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SalesPage />
    </QueryClientProvider>,
  );
}

describe("SalesPage", () => {
  beforeEach(() => {
    vi.mocked(listProducts).mockResolvedValue([product]);
    vi.mocked(listSales).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    vi.mocked(listCustomers).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 50,
      total: 0,
    });
    vi.mocked(createSale).mockResolvedValue({
      replayed: false,
      sale: {
        id: "sale-1",
        receiptNumber: "SM-000001",
        status: "COMPLETED",
        customerId: null,
        customerName: null,
        subtotal: "100.00",
        total: "100.00",
        amountPaid: "100.00",
        outstandingBalance: "0.00",
        paymentMethod: "CASH",
        notes: null,
        soldAt: new Date().toISOString(),
        voidedAt: null,
        items: [],
        payments: [],
      },
    });
  });

  it("adds a product and confirms a sale once", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText("Rice 1kg")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.click(screen.getByRole("button", { name: "Confirm sale" }));

    await waitFor(() => {
      expect(createSale).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/SM-000001/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm sale" })).toBeDisabled();
  });
});
