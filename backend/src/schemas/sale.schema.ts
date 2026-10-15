import { z } from "zod";
import { calendarDaySchema, optionalText, positiveDecimalString, decimalString } from "./common.js";
import { paginationQuerySchema } from "../lib/pagination.js";

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "TELEBIRR",
  "OTHER",
  "CREDIT",
] as const;

export const createSaleSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().trim().min(1),
          quantity: positiveDecimalString("Quantity", 3),
        }),
      )
      .min(1, "Add at least one product.")
      .max(50),
    paymentMethod: z.enum(PAYMENT_METHODS),
    amountPaid: decimalString("Amount paid", 2),
    customerId: z.string().trim().min(1).nullable().optional(),
    notes: optionalText(500),
    paymentReference: optionalText(120),
  })
  .superRefine((value, ctx) => {
    const paid = Number(value.amountPaid);
    if (value.paymentMethod === "CREDIT" && paid > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentMethod"],
        message: "Use cash, bank transfer, or Telebirr when a payment is collected.",
      });
    }
    if (value.paymentMethod !== "CREDIT" && paid === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["amountPaid"],
        message: "Enter the amount collected, or choose credit for an unpaid sale.",
      });
    }
  });

export type CreateSaleInput = z.infer<typeof createSaleSchema>;

export const listSalesQuerySchema = paginationQuerySchema.extend({
  from: calendarDaySchema.optional(),
  to: calendarDaySchema.optional(),
  status: z.enum(["COMPLETED", "PARTIALLY_PAID", "UNPAID", "VOIDED"]).optional(),
});

export type ListSalesQuery = z.infer<typeof listSalesQuerySchema>;

export const voidSaleSchema = z.object({
  reason: optionalText(200),
});

export type VoidSaleInput = z.infer<typeof voidSaleSchema>;
