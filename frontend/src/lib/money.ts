function parseScaled(value: string, scale: number): number {
  const trimmed = value.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return Number.NaN;
  }

  const [whole, fraction = ""] = trimmed.split(".");
  const digits = (fraction + "0".repeat(scale)).slice(0, scale);
  return Number(whole) * 10 ** scale + Number(digits);
}

/** Display-only money math. The server recalculates every saved total. */
export function multiplyMoney(price: string, quantity: string): string {
  const cents = parseScaled(price, 2);
  const milli = parseScaled(quantity, 3);
  if (!Number.isFinite(cents) || !Number.isFinite(milli)) {
    return "0.00";
  }

  const lineCents = Math.round((cents * milli) / 1000);
  return (lineCents / 100).toFixed(2);
}

export function addMoney(values: string[]): string {
  const total = values.reduce((sum, value) => {
    const cents = parseScaled(value, 2);
    return sum + (Number.isFinite(cents) ? cents : 0);
  }, 0);
  return (total / 100).toFixed(2);
}

export function compareMoney(left: string, right: string): number {
  const leftCents = parseScaled(left, 2);
  const rightCents = parseScaled(right, 2);
  if (!Number.isFinite(leftCents) || !Number.isFinite(rightCents)) {
    return Number.NaN;
  }
  return leftCents - rightCents;
}
