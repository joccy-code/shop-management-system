export type ProductStatus = "ACTIVE" | "ARCHIVED";

export type Product = {
  id: string;
  shopId: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  name: string;
  sku: string | null;
  sellingPrice: string;
  unitCost: string;
  stockQuantity: string;
  lowStockThreshold: string;
  unitOfMeasure: string | null;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovementType =
  | "SALE"
  | "ADJUSTMENT"
  | "PURCHASE"
  | "RETURN"
  | "INITIAL";

export type InventoryMovement = {
  id: string;
  productId: string;
  type: InventoryMovementType;
  quantityChange: string;
  quantityAfter: string;
  reason: string | null;
  createdAt: string;
};

export type Category = {
  id: string;
  shopId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};
