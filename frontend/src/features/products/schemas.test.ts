import { describe, expect, it } from "vitest";
import { productFormSchema, stockAdjustmentFormSchema } from "./schemas";

describe("product schemas", () => {
  it("requires a product name", () => {
    const result = productFormSchema.safeParse({
      name: "",
      categoryId: "",
      sku: "",
      sellingPrice: "10",
      unitCost: "5",
      stockQuantity: "0",
      lowStockThreshold: "0",
      unitOfMeasure: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a negative selling price", () => {
    const result = productFormSchema.safeParse({
      name: "Sugar",
      categoryId: "",
      sku: "",
      sellingPrice: "-5",
      unitCost: "5",
      stockQuantity: "0",
      lowStockThreshold: "0",
      unitOfMeasure: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid product", () => {
    const result = productFormSchema.safeParse({
      name: "Sugar",
      categoryId: "",
      sku: "",
      sellingPrice: "95.50",
      unitCost: "80",
      stockQuantity: "20",
      lowStockThreshold: "5",
      unitOfMeasure: "pc",
    });
    expect(result.success).toBe(true);
  });
});

describe("stock adjustment schema", () => {
  it("rejects a zero quantity change", () => {
    const result = stockAdjustmentFormSchema.safeParse({
      quantityChange: "0",
      reason: "Count",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a negative quantity change with a reason", () => {
    const result = stockAdjustmentFormSchema.safeParse({
      quantityChange: "-2",
      reason: "Damaged",
    });
    expect(result.success).toBe(true);
  });
});
