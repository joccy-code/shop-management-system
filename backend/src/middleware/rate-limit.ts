import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/app-error.js";
import { loadEnv } from "../lib/env.js";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function resetRateLimits(): void {
  buckets.clear();
}

export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function rateLimit(options: {
  name: string;
  limit: number;
  windowMs: number;
}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (loadEnv().NODE_ENV === "test") {
      next();
      return;
    }

    const key = `${options.name}:${req.ip ?? "unknown"}`;
    const result = consumeRateLimit(key, options.limit, options.windowMs);

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSeconds));
      next(
        new AppError(
          429,
          "RATE_LIMITED",
          "Too many attempts. Wait a moment and try again.",
        ),
      );
      return;
    }

    next();
  };
}
