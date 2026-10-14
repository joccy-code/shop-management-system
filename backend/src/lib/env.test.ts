import { afterEach, describe, expect, it } from "vitest";
import { loadEnv, resetEnvCache } from "./env.js";

const requiredEnv = {
  DATABASE_URL:
    "postgresql://postgres:postgres@127.0.0.1:5432/shop_manager_test?schema=public",
  SESSION_SECRET: "test-session-secret-at-least-32-characters",
};

describe("loadEnv", () => {
  afterEach(() => {
    resetEnvCache();
  });

  it("loads defaults for optional settings", () => {
    const env = loadEnv({
      ...process.env,
      ...requiredEnv,
      NODE_ENV: "test",
      PORT: undefined,
      APP_NAME: undefined,
      APP_CURRENCY: undefined,
      APP_TIMEZONE: undefined,
    });

    expect(env.PORT).toBe(3001);
    expect(env.APP_NAME).toBe("Shop Manager");
    expect(env.APP_CURRENCY).toBe("ETB");
    expect(env.APP_TIMEZONE).toBe("Africa/Addis_Ababa");
  });

  it("rejects a short session secret", () => {
    expect(() =>
      loadEnv({
        ...process.env,
        ...requiredEnv,
        SESSION_SECRET: "too-short",
      }),
    ).toThrow(/Invalid environment configuration/);
  });
});
