import { afterEach, describe, expect, it } from "vitest";
import { am } from "./am";
import { en } from "./en";
import { getAppName, getLocale, setLocale, t } from "./index";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("i18n helpers", () => {
  afterEach(() => {
    setLocale("en");
    localStorage.removeItem("shop-manager.locale");
  });

  it("returns English navigation labels", () => {
    expect(t().nav.home).toBe("Home");
    expect(t().nav.sales).toBe("Sales");
  });

  it("falls back to Shop Manager when no env name is set", () => {
    expect(getAppName()).toBe("Shop Manager");
  });

  it("switches the catalog to Amharic and remembers the choice", () => {
    setLocale("am");
    expect(getLocale()).toBe("am");
    expect(t().nav.home).toBe("መነሻ");
    expect(t().reports.headline).toBe("የንግድ ሪፖርቶች");
    expect(localStorage.getItem("shop-manager.locale")).toBe("am");
    expect(getAppName()).toBe("ሱቅ አስተዳዳሪ");
    expect(document.documentElement.lang).toBe("am");
    expect(document.documentElement.getAttribute("translate")).toBe("no");
    expect(document.documentElement.classList.contains("notranslate")).toBe(true);
    expect(document.body.getAttribute("translate")).toBe("no");
    expect(
      document.head.querySelector('meta[name="google"]')?.getAttribute("content"),
    ).toBe("notranslate");
  });

  it("keeps the same message keys in English and Amharic", () => {
    expect(keyPaths(am).sort()).toEqual(keyPaths(en).sort());
  });
});
