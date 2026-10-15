import type { NextFunction, Request, Response } from "express";
import { loadEnv } from "../lib/env.js";
import { AppError } from "../lib/app-error.js";
import { resolveSession } from "../services/auth.service.js";

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const env = loadEnv();
    const token = req.cookies?.[env.SESSION_COOKIE_NAME] as
      | string
      | undefined;
    const context = await resolveSession(token);

    if (!context) {
      throw new AppError(401, "AUTH_REQUIRED", "Sign in to continue.");
    }

    req.auth = context;
    next();
  } catch (error) {
    next(error);
  }
}
