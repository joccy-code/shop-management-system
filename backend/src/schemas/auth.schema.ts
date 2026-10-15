import { z } from "zod";
import { normalizePhone } from "../lib/phone.js";

const phoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required.")
  .transform((value, ctx) => {
    try {
      return normalizePhone(value);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid phone number, e.g. 0912345678.",
      });
      return z.NEVER;
    }
  });

export const registerSchema = z.object({
  shopName: z.string().trim().min(2).max(120),
  displayName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  password: z.string().min(8).max(72),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8).max(72),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
