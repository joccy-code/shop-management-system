import { describe, expect, it } from "vitest";
import {
  calendarDay,
  startOfZonedDay,
  zonedRange,
} from "./dates.js";

describe("shop timezone dates", () => {
  const timeZone = "Africa/Addis_Ababa";

  it("treats Addis midnight as 21:00 UTC the previous day", () => {
    const start = startOfZonedDay("2026-10-15", timeZone);
    expect(start.toISOString()).toBe("2026-10-14T21:00:00.000Z");
    expect(calendarDay(start, timeZone)).toBe("2026-10-15");
  });

  it("builds a half-open range that includes the end day", () => {
    const range = zonedRange("2026-10-01", "2026-10-02", timeZone);
    expect(range.start.toISOString()).toBe("2026-09-30T21:00:00.000Z");
    expect(range.end.toISOString()).toBe("2026-10-02T21:00:00.000Z");
  });

  it("rejects an inverted range", () => {
    expect(() => zonedRange("2026-10-02", "2026-10-01", timeZone)).toThrow(
      /date range/i,
    );
  });
});
