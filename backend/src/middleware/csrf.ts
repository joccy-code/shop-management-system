import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/app-error.js";
import { loadEnv } from "../lib/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function allowedOrigins(req: Request): Set<string> {
  const env = loadEnv();
  const host = req.get("host");
  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || req.protocol || "http";
  const allowed = new Set<string>();

  if (host) {
    allowed.add(`${proto}://${host}`);
  }

  if (env.CORS_ORIGIN) {
    allowed.add(env.CORS_ORIGIN);
  }

  return allowed;
}

/**
 * Blocks cross-site form posts that carry a foreign Origin.
 * Same-origin browser calls also send `X-Shop-Manager: 1`, which is accepted
 * even when a proxy rewrites the host. Non-browser clients omit Origin.
 */
export function csrfProtection(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  if (req.get("x-shop-manager") === "1") {
    next();
    return;
  }

  const origin = req.get("origin");
  if (!origin) {
    next();
    return;
  }

  if (allowedOrigins(req).has(origin)) {
    next();
    return;
  }

  next(
    new AppError(
      403,
      "CSRF_REJECTED",
      "This request was blocked. Refresh the page and try again.",
    ),
  );
}
