import { z } from "zod";
import { paginationQuerySchema } from "../lib/pagination.js";
import {
  calendarDaySchema,
  optionalText,
  positiveDecimalString,
} from "./common.js";

export const EXPENSE_CATEGORIES = [
  "rent",
  "transport",
  "utilities",
  "wages",
  "supplies",
  "other",
] as const;

export const createExpenseSchema = z.object({
  description: z.string().trim().min(1, "Description is required.").max(160),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: positiveDecimalString("Amount", 2),
  expenseDate: calendarDaySchema,
  note: optionalText(500),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z
  .object({
    description: z.string().trim().min(1).max(160).optional(),
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    amount: positiveDecimalString("Amount", 2).optional(),
    expenseDate: calendarDaySchema.optional(),
    note: optionalText(500),
    status: z.enum(["RECORDED", "VOIDED"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Nothing to update.");

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const listExpensesQuerySchema = paginationQuerySchema.extend({
  from: calendarDaySchema.optional(),
  to: calendarDaySchema.optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  includeVoided: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;
