import type { Request, Response } from "express";
import { getPublicConfig, loadEnv } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import { sendError, sendSuccess } from "../lib/api-response.js";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const env = loadEnv();
  sendSuccess(res, {
    status: "ok",
    service: "shop-manager-api",
    ...getPublicConfig(env),
    timestamp: new Date().toISOString(),
  });
}

export async function getReady(_req: Request, res: Response): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    sendSuccess(res, {
      status: "ready",
      database: "up",
      timestamp: new Date().toISOString(),
    });
  } catch {
    sendError(
      res,
      503,
      "NOT_READY",
      "The application is not ready to serve traffic.",
      { database: "down" },
    );
  }
}
