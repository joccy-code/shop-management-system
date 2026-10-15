import { en, type Messages } from "./en";

const catalogs = {
  en,
} as const;

export type Locale = keyof typeof catalogs;

let currentLocale: Locale = "en";

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(): Messages {
  return catalogs[currentLocale];
}

export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME?.trim() || t().appNameFallback;
}
