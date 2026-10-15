import { describe, expect, it } from "vitest";
import { addMoney, compareMoney, multiplyMoney } from "./money";

describe("display money math", () => {
  it("multiplies price and quantity with half-up cents", () => {
    expect(multiplyMoney("100.00", "1.5")).toBe("150.00");
    expect(multiplyMoney("10.00", "0.005")).toBe("0.05");
  });

  it("adds money strings", () => {
    expect(addMoney(["10.50", "2.25"])).toBe("12.75");
  });

  it("compares amounts in cents", () => {
    expect(compareMoney("10.00", "10.00")).toBe(0);
    expect(compareMoney("9.99", "10.00")).toBeLessThan(0);
  });
});
