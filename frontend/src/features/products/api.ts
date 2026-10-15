import { api } from "@/lib/api";
import type { Category, InventoryMovement, Product, ProductStatus } from "./types";

export type ProductInput = {
  name: string;
  categoryId?: string | null;
  sku?: string | null;
  sellingPrice: string;
  unitCost: string;
  stockQuantity?: string;
  lowStockThreshold?: string;
  unitOfMeasure?: string | null;
};

export type ProductUpdateInput = Partial<ProductInput> & {
  status?: ProductStatus;
};

export function listProducts(
  search?: string,
  status: ProductStatus = "ACTIVE",
): Promise<Product[]> {
  const params = new URLSearchParams({ status });
  if (search) {
    params.set("search", search);
  }
  return api.get<Product[]>(`/products?${params.toString()}`);
}

export function createProduct(input: ProductInput): Promise<Product> {
  return api.post<Product>("/products", input);
}

export function updateProduct(
  id: string,
  input: ProductUpdateInput,
): Promise<Product> {
  return api.patch<Product>(`/products/${id}`, input);
}

export function archiveProduct(id: string): Promise<Product> {
  return api.delete<Product>(`/products/${id}`);
}

export type StockAdjustmentPayload = {
  quantityChange: string;
  reason: string;
};

export type StockAdjustmentResult = {
  product: Product;
  movement: InventoryMovement;
};

export function adjustStock(
  id: string,
  input: StockAdjustmentPayload,
): Promise<StockAdjustmentResult> {
  return api.post<StockAdjustmentResult>(
    `/products/${id}/stock-adjustments`,
    input,
  );
}

export function listStockMovements(id: string): Promise<InventoryMovement[]> {
  return api.get<InventoryMovement[]>(`/products/${id}/stock-adjustments`);
}

export function listCategories(): Promise<Category[]> {
  return api.get<Category[]>("/categories");
}

export function createCategory(name: string): Promise<Category> {
  return api.post<Category>("/categories", { name });
}
