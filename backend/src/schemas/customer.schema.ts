import { z } from "zod";
import { paginationQuerySchema } from "../lib/pagination.js";
import { normalizePhone } from "../lib/phone.js";
import { optionalText, positiveDecimalString } from "./common.js";

const optionalPhone = z
  .string()
  .trim()
  .max(20)
  .nullable()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === "") {
      return null;
    }
    try {
      return normalizePhone(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number, or leave it blank.",
      });
      return z.NEVER;
    }
  });

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Customer name is required.").max(120),
  phone: optionalPhone,
  notes: optionalText(500),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    phone: optionalPhone,
    notes: optionalText(500),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Nothing to update.",
  });

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;

export const listCustomersQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
});

export type ListCustomersQuery = z.infer<typeof listCustomersQuerySchema>;

export const REPAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "TELEBIRR",
  "OTHER",
] as const;

export const createRepaymentSchema = z.object({
  saleId: z.string().trim().min(1),
  amount: positiveDecimalString("Repayment amount", 2),
  method: z.enum(REPAYMENT_METHODS).default("CASH"),
  note: optionalText(300),
});

export type CreateRepaymentInput = z.infer<typeof createRepaymentSchema>;
