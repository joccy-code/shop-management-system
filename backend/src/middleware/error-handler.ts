import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { sendError } from "../lib/api-response.js";
import { AppError } from "../lib/app-error.js";
import { loadEnv } from "../lib/env.js";
import { logger } from "../lib/logger.js";

export { AppError } from "../lib/app-error.js";

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, "NOT_FOUND", "The requested resource was not found.");
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(
      res,
      400,
      "VALIDATION_ERROR",
      "Some of the submitted information is invalid.",
      err.flatten(),
    );
    return;
  }

  if (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2002"
  ) {
    sendError(res, 409, "CONFLICT", "That record already exists.");
    return;
  }

  const safeError =
    err instanceof Error
      ? { name: err.name, message: err.message }
      : { message: "Unknown error" };
  logger.error(
    loadEnv().NODE_ENV === "production" ? safeError : { err },
    "Unhandled server error",
  );
  sendError(
    res,
    500,
    "INTERNAL_ERROR",
    "Something went wrong. Please try again.",
  );
}
