import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Product } from "@/features/products/types";
import { ProductsPage } from "./ProductsPage";

vi.mock("@/features/products/api", () => ({
  listProducts: vi.fn(),
  listCategories: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  archiveProduct: vi.fn(),
  adjustStock: vi.fn(),
  listStockMovements: vi.fn(),
  createCategory: vi.fn(),
}));

import {
  createProduct,
  listCategories,
  listProducts,
} from "@/features/products/api";

const sampleProduct: Product = {
  id: "p1",
  shopId: "s1",
  categoryId: null,
  category: null,
  name: "Sugar 1kg",
  sku: null,
  sellingPrice: "95.50",
  unitCost: "80.00",
  stockQuantity: "20.000",
  lowStockThreshold: "5.000",
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
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listCategories).mockResolvedValue([]);
  });

  it("shows an empty state when there are no products", async () => {
    vi.mocked(listProducts).mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText("No products yet")).toBeInTheDocument();
  });

  it("lists products with price and stock", async () => {
    vi.mocked(listProducts).mockResolvedValue([sampleProduct]);
    renderPage();

    expect(await screen.findByText("Sugar 1kg")).toBeInTheDocument();
    expect(screen.getByText(/95\.50/)).toBeInTheDocument();
    expect(screen.getByText(/20\.000 pc/)).toBeInTheDocument();
  });

  it("flags low stock when quantity is at or below the threshold", async () => {
    vi.mocked(listProducts).mockResolvedValue([
      { ...sampleProduct, stockQuantity: "4.000" },
    ]);
    renderPage();

    expect(await screen.findByText(/Low stock/)).toBeInTheDocument();
  });

  it("creates a product through the add product form", async () => {
    vi.mocked(listProducts)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([sampleProduct]);
    vi.mocked(createProduct).mockResolvedValue(sampleProduct);

    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: /add product/i }),
    );
    await user.type(screen.getByLabelText("Product name"), "Sugar 1kg");
    await user.type(screen.getByLabelText("Selling price"), "95.50");
    await user.type(screen.getByLabelText("Unit cost"), "80");
    await user.click(screen.getByRole("button", { name: "Save product" }));

    await waitFor(() => expect(createProduct).toHaveBeenCalled());
    expect(await screen.findByText("Sugar 1kg")).toBeInTheDocument();
  });
});
