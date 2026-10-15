import { describe, expect, it } from "vitest";
import { addMoney, multiplyMoney, toMoneyString } from "./money.js";

describe("money helpers", () => {
  it("formats values with two decimal places", () => {
    expect(toMoneyString("10")).toBe("10.00");
    expect(toMoneyString("10.5")).toBe("10.50");
  });

  it("adds money without floating-point drift", () => {
    expect(toMoneyString(addMoney("0.1", "0.2"))).toBe("0.30");
  });

  it("multiplies and rounds half-up to cents", () => {
    expect(toMoneyString(multiplyMoney("10.005", "1"))).toBe("10.01");
    expect(toMoneyString(multiplyMoney("3.33", "2"))).toBe("6.66");
  });
});
