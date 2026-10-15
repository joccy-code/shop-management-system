import { getLocale } from "@/i18n";

const currency = import.meta.env.VITE_APP_CURRENCY || "ETB";
const timeZone = import.meta.env.VITE_APP_TIMEZONE || "Africa/Addis_Ababa";

function intlLocale(): string {
  return getLocale() === "am" ? "am-ET" : "en-ET";
}

export function formatMoney(amount: string | number): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(value)) {
    return getLocale() === "am" ? "— ብር" : `${currency} —`;
  }

  if (getLocale() === "am") {
    const formatted = new Intl.NumberFormat("am-ET", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
    return `${formatted} ብር`;
  }

  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatQuantity(value: string): string {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return value;
  }
  return new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 3 }).format(number);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(intlLocale(), {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(intlLocale(), {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function todayInputValue(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
