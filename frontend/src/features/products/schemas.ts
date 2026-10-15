import { z } from "zod";
import { t } from "@/i18n";

function withLabel(template: string, label: string): string {
  return template.replaceAll("{label}", label);
}

function numberString(label: string) {
  const messages = t().validation;
  return z
    .string()
    .trim()
    .min(1, withLabel(messages.required, label))
    .refine((value) => !Number.isNaN(Number(value)), withLabel(messages.number, label))
    .refine((value) => Number(value) >= 0, withLabel(messages.negative, label));
}

export function createProductFormSchema() {
  const messages = t();
  return z.object({
    name: z.string().trim().min(1, messages.validation.productName),
    categoryId: z.string(),
    sku: z.string(),
    sellingPrice: numberString(messages.products.sellingPriceLabel),
    unitCost: numberString(messages.products.unitCostLabel),
    stockQuantity: numberString(messages.products.stockQuantityLabel),
    lowStockThreshold: numberString(messages.products.lowStockThresholdLabel),
    unitOfMeasure: z.string(),
  });
}

export type ProductFormValues = z.infer<ReturnType<typeof createProductFormSchema>>;

export function createStockAdjustmentFormSchema() {
  const messages = t().validation;
  return z.object({
    quantityChange: z
      .string()
      .trim()
      .min(1, messages.quantity)
      .refine(
        (value) => !Number.isNaN(Number(value)) && Number(value) !== 0,
        messages.nonZero,
      ),
    reason: z.string().trim().min(1, messages.reason),
  });
}

export type StockAdjustmentFormValues = z.infer<
  ReturnType<typeof createStockAdjustmentFormSchema>
>;
