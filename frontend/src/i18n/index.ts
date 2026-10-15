import { useSyncExternalStore } from "react";
import { am } from "./am";
import { en, type Messages } from "./en";

const catalogs = {
  en,
  am,
} as const;

export type Locale = keyof typeof catalogs;

const STORAGE_KEY = "shop-manager.locale";

const listeners = new Set<() => void>();

function readStoredLocale(): Locale {
  if (typeof localStorage === "undefined") {
    return "en";
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "am") {
      return stored;
    }
  } catch {
    // Ignore storage failures and keep the default language.
  }
  return "en";
}

let currentLocale: Locale = readStoredLocale();

if (typeof document !== "undefined") {
  document.documentElement.lang = currentLocale;
}

function subscribeLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLocale(locale: Locale): void {
  if (currentLocale === locale) {
    return;
  }
  currentLocale = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // The choice still applies for this visit.
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
  for (const listener of listeners) {
    listener();
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}

export function useMessages(): Messages {
  const locale = useLocale();
  return catalogs[locale];
}

export function t(): Messages {
  return catalogs[currentLocale];
}

export function getAppName(): string {
  return import.meta.env.VITE_APP_NAME?.trim() || t().appNameFallback;
}
