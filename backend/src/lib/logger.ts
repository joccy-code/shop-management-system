import pino from "pino";
import { loadEnv } from "./env.js";

function resolveLogLevel() {
  try {
    return loadEnv().LOG_LEVEL;
  } catch {
    return "info" as const;
  }
}

function resolveNodeEnv() {
  try {
    return loadEnv().NODE_ENV;
  } catch {
    return process.env.NODE_ENV ?? "development";
  }
}

const level = resolveLogLevel();
const nodeEnv = resolveNodeEnv();

export const logger =
  nodeEnv === "development"
    ? pino({
        level,
        redact: {
          paths: [
            "password",
            "passwordHash",
            "req.headers.cookie",
            "req.headers.authorization",
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        },
      })
    : pino({
        level,
        redact: {
          paths: [
            "password",
            "passwordHash",
            "req.headers.cookie",
            "req.headers.authorization",
            'res.headers["set-cookie"]',
          ],
          remove: true,
        },
      });
