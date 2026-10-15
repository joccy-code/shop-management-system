import { describe, expect, it } from "vitest";
import { consumeRateLimit, resetRateLimits } from "./rate-limit.js";

describe("consumeRateLimit", () => {
  it("blocks further attempts inside the window", () => {
    resetRateLimits();
    const now = 1_000_000;
    expect(consumeRateLimit("login:1", 2, 60_000, now).allowed).toBe(true);
    expect(consumeRateLimit("login:1", 2, 60_000, now + 10).allowed).toBe(true);
    const blocked = consumeRateLimit("login:1", 2, 60_000, now + 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(consumeRateLimit("login:1", 2, 60_000, now + 60_000).allowed).toBe(
      true,
    );
  });
});
