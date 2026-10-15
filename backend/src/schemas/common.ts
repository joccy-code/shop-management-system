import { z } from "zod";

export const decimalString = (label: string, maxFractionDigits: number) =>
  z
    .union([z.number(), z.string()])
    .transform((value) => String(value).trim())
    .refine(
      (value) => /^\d+(\.\d+)?$/.test(value),
      `${label} must be a positive number.`,
    )
    .refine((value) => {
      const fraction = value.split(".")[1] ?? "";
      return fraction.length <= maxFractionDigits;
    }, `${label} has too many decimal places.`)
    .refine((value) => Number(value) >= 0, `${label} cannot be negative.`);

export const positiveDecimalString = (
  label: string,
  maxFractionDigits: number,
) =>
  decimalString(label, maxFractionDigits).refine(
    (value) => Number(value) > 0,
    `${label} must be greater than zero.`,
  );

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value ? value : null));

export const calendarDaySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date in YYYY-MM-DD format.");
