import { z } from "zod";

export const loginSchema = z.object({
  phone: z.string().trim().min(7, "Enter your phone number."),
  password: z.string().min(1, "Enter your password."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    shopName: z.string().trim().min(2, "Enter your shop name."),
    displayName: z.string().trim().min(2, "Enter your name."),
    phone: z.string().trim().min(7, "Enter your phone number."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
