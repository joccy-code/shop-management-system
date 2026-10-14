import { Decimal } from "decimal.js";

Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export { Decimal };

/** Formats a decimal money value using exactly two fraction digits. */
export function toMoneyString(value: Decimal.Value): string {
  return new Decimal(value).toFixed(2);
}

export function addMoney(...values: Decimal.Value[]): Decimal {
  return values.reduce<Decimal>(
    (total, value) => total.plus(value),
    new Decimal(0),
  );
}

export function multiplyMoney(
  left: Decimal.Value,
  right: Decimal.Value,
): Decimal {
  return new Decimal(left).times(right).toDecimalPlaces(2);
}
