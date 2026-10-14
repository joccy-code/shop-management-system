import type { Category, InventoryMovement, Product } from "@prisma/client";
import { Decimal } from "./money.js";

export type SerializedProduct = {
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
  status: Product["status"];
  createdAt: string;
  updatedAt: string;
};

export function serializeProduct(
  product: Product & { category?: Category | null },
): SerializedProduct {
  return {
    id: product.id,
    shopId: product.shopId,
    categoryId: product.categoryId,
    category: product.category
      ? { id: product.category.id, name: product.category.name }
      : null,
    name: product.name,
    sku: product.sku,
    sellingPrice: new Decimal(product.sellingPrice).toFixed(2),
    unitCost: new Decimal(product.unitCost).toFixed(2),
    stockQuantity: new Decimal(product.stockQuantity).toFixed(3),
    lowStockThreshold: new Decimal(product.lowStockThreshold).toFixed(3),
    unitOfMeasure: product.unitOfMeasure,
    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type SerializedInventoryMovement = {
  id: string;
  productId: string;
  type: InventoryMovement["type"];
  quantityChange: string;
  quantityAfter: string;
  reason: string | null;
  createdAt: string;
};

export function serializeInventoryMovement(
  movement: InventoryMovement,
): SerializedInventoryMovement {
  return {
    id: movement.id,
    productId: movement.productId,
    type: movement.type,
    quantityChange: new Decimal(movement.quantityChange).toFixed(3),
    quantityAfter: new Decimal(movement.quantityAfter).toFixed(3),
    reason: movement.reason,
    createdAt: movement.createdAt.toISOString(),
  };
}
