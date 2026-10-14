import { z } from "zod";

const numberString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => !Number.isNaN(Number(value)), `${label} must be a number.`)
    .refine((value) => Number(value) >= 0, `${label} cannot be negative.`);

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a product name."),
  categoryId: z.string(),
  sku: z.string(),
  sellingPrice: numberString("Selling price"),
  unitCost: numberString("Unit cost"),
  stockQuantity: numberString("Stock quantity"),
  lowStockThreshold: numberString("Low stock alert level"),
  unitOfMeasure: z.string(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

export const stockAdjustmentFormSchema = z.object({
  quantityChange: z
    .string()
    .trim()
    .min(1, "Enter a quantity.")
    .refine(
      (value) => !Number.isNaN(Number(value)) && Number(value) !== 0,
      "Enter a non-zero number.",
    ),
  reason: z.string().trim().min(1, "Enter a reason."),
});

export type StockAdjustmentFormValues = z.infer<
  typeof stockAdjustmentFormSchema
>;
