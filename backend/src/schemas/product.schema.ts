import { z } from "zod";

const decimalString = (label: string) =>
  z
    .union([z.number(), z.string()])
    .transform((value) => String(value).trim())
    .refine(
      (value) => value.length > 0 && !Number.isNaN(Number(value)),
      `${label} must be a number.`,
    )
    .refine(
      (value) => Number(value) >= 0,
      `${label} cannot be negative.`,
    );

const optionalCuid = z
  .string()
  .trim()
  .min(1)
  .nullable()
  .optional();

export const createProductSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(160),
  categoryId: optionalCuid,
  sku: z.string().trim().max(64).nullable().optional(),
  sellingPrice: decimalString("Selling price"),
  unitCost: decimalString("Unit cost"),
  stockQuantity: decimalString("Stock quantity").default("0"),
  lowStockThreshold: decimalString("Low stock threshold").default("0"),
  unitOfMeasure: z.string().trim().max(32).nullable().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  categoryId: optionalCuid,
  sku: z.string().trim().max(64).nullable().optional(),
  sellingPrice: decimalString("Selling price").optional(),
  unitCost: decimalString("Unit cost").optional(),
  lowStockThreshold: decimalString("Low stock threshold").optional(),
  unitOfMeasure: z.string().trim().max(32).nullable().optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

export const stockAdjustmentSchema = z.object({
  quantityChange: z
    .union([z.number(), z.string()])
    .transform((value) => String(value).trim())
    .refine(
      (value) => value.length > 0 && !Number.isNaN(Number(value)),
      "Quantity must be a number.",
    )
    .refine((value) => Number(value) !== 0, "Enter a non-zero amount."),
  reason: z.string().trim().min(1, "Enter a reason for this adjustment.").max(200),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const listProductsQuerySchema = z.object({
  search: z.string().trim().max(160).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required.").max(120),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
