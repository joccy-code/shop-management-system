/**
 * Accepts Ethiopian local format (0XXXXXXXXX), Ethiopian international format
 * (+251XXXXXXXXX), or a generic international number, and normalizes to a
 * single canonical E.164-like form so the same number always maps to one
 * account regardless of how a user types it.
 */
export const PHONE_REGEX = /^(?:\+251\d{9}|0\d{9}|\+\d{8,15})$/;

export function normalizePhone(rawPhone: string): string {
  const compact = rawPhone.trim().replace(/[\s-]/g, "");

  if (/^0\d{9}$/.test(compact)) {
    return `+251${compact.slice(1)}`;
  }

  if (PHONE_REGEX.test(compact)) {
    return compact;
  }

  throw new Error(`Invalid phone number: ${rawPhone}`);
}
