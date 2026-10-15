import { describe, expect, it } from "vitest";
import { normalizePhone } from "./phone.js";

describe("normalizePhone", () => {
  it("converts Ethiopian local format to international format", () => {
    expect(normalizePhone("0912345678")).toBe("+251912345678");
  });

  it("strips spaces and dashes before normalizing", () => {
    expect(normalizePhone("091 234-5678")).toBe("+251912345678");
  });

  it("passes through an already-international Ethiopian number", () => {
    expect(normalizePhone("+251912345678")).toBe("+251912345678");
  });

  it("accepts a generic international number", () => {
    expect(normalizePhone("+14155552671")).toBe("+14155552671");
  });

  it("throws for an invalid phone number", () => {
    expect(() => normalizePhone("not-a-phone")).toThrow(/Invalid phone number/);
  });

  it("throws for a too-short local number", () => {
    expect(() => normalizePhone("091234")).toThrow(/Invalid phone number/);
  });
});
