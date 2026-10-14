import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

describe("auth schemas", () => {
  it("requires both fields for login", () => {
    const result = loginSchema.safeParse({ phone: "", password: "" });
    expect(result.success).toBe(false);
  });

  it("accepts valid login input", () => {
    const result = loginSchema.safeParse({
      phone: "0912345678",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects registration when passwords do not match", () => {
    const result = registerSchema.safeParse({
      shopName: "Shop",
      displayName: "Owner",
      phone: "0912345678",
      password: "password1",
      confirmPassword: "password2",
    });
    expect(result.success).toBe(false);
  });

  it("accepts registration when passwords match", () => {
    const result = registerSchema.safeParse({
      shopName: "Shop",
      displayName: "Owner",
      phone: "0912345678",
      password: "password1",
      confirmPassword: "password1",
    });
    expect(result.success).toBe(true);
  });
});
