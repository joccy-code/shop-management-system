import { describe, expect, it } from "vitest";
import { getAppName, t } from "./index";

describe("i18n helpers", () => {
  it("returns English navigation labels", () => {
    expect(t().nav.home).toBe("Home");
    expect(t().nav.sales).toBe("Sales");
  });

  it("falls back to Shop Manager when no env name is set", () => {
    expect(getAppName()).toBe("Shop Manager");
  });
});
