import { z } from "zod";
import { t } from "@/i18n";

export function createLoginSchema() {
  const messages = t().validation;
  return z.object({
    phone: z.string().trim().min(7, messages.phone),
    password: z.string().min(1, messages.password),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function createRegisterSchema() {
  const messages = t().validation;
  return z
    .object({
      shopName: z.string().trim().min(2, messages.shopName),
      displayName: z.string().trim().min(2, messages.displayName),
      phone: z.string().trim().min(7, messages.phone),
      password: z.string().min(8, messages.passwordLength),
      confirmPassword: z.string().min(1, messages.confirmPassword),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: messages.passwordMismatch,
    });
}

export type RegisterFormValues = z.infer<ReturnType<typeof createRegisterSchema>>;
