import { createHash, randomBytes } from "node:crypto";
import { loadEnv } from "./env.js";

export type SessionToken = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): SessionToken {
  const token = randomBytes(32).toString("hex");
  const ttlHours = loadEnv().SESSION_TTL_HOURS;
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  return { token, tokenHash: hashToken(token), expiresAt };
}
