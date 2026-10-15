import { resetEnvCache } from "../lib/env.js";

// Tests set process.env directly and do not require a .env file.
process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT ?? "3001";
process.env.APP_NAME = process.env.APP_NAME ?? "Shop Manager";
process.env.APP_CURRENCY = process.env.APP_CURRENCY ?? "ETB";
process.env.APP_TIMEZONE = process.env.APP_TIMEZONE ?? "Africa/Addis_Ababa";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@127.0.0.1:5432/shop_manager_test?schema=public";
process.env.SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? "shop_manager_session";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ?? "test-session-secret-at-least-32-characters";
process.env.SESSION_TTL_HOURS = process.env.SESSION_TTL_HOURS ?? "168";
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? "false";
process.env.COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE ?? "lax";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "";
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "silent";

resetEnvCache();
