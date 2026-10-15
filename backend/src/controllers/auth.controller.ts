import type { Request, Response } from "express";
import type { Shop, User } from "@prisma/client";
import { loadEnv } from "../lib/env.js";
import { sendSuccess } from "../lib/api-response.js";
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
} from "../schemas/auth.schema.js";
import {
  authenticate,
  changePassword,
  createSession,
  getAuthenticatedShopAndUser,
  registerShopOwner,
  revokeSession,
} from "../services/auth.service.js";
import type { SessionToken } from "../lib/session-token.js";

function serializeAuthUser(user: User, shop: Shop) {
  return {
    id: user.id,
    phone: user.phone,
    displayName: user.displayName,
    role: user.role,
    shop: {
      id: shop.id,
      name: shop.name,
      currency: shop.currency,
      timezone: shop.timezone,
    },
  };
}

function setSessionCookie(res: Response, session: SessionToken): void {
  const env = loadEnv();
  res.cookie(env.SESSION_COOKIE_NAME, session.token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    expires: session.expiresAt,
    path: "/",
  });
}

function clearSessionCookie(res: Response): void {
  const env = loadEnv();
  res.clearCookie(env.SESSION_COOKIE_NAME, { path: "/" });
}

export async function postRegister(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const { shop, user } = await registerShopOwner(input);
  const session = await createSession(user.id, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  setSessionCookie(res, session);
  sendSuccess(res, serializeAuthUser(user, shop), 201);
}

export async function postLogin(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const { shop, user } = await authenticate(input);
  const session = await createSession(user.id, {
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  setSessionCookie(res, session);
  sendSuccess(res, serializeAuthUser(user, shop));
}

export async function postLogout(req: Request, res: Response): Promise<void> {
  const env = loadEnv();
  const token = req.cookies?.[env.SESSION_COOKIE_NAME] as string | undefined;

  if (token) {
    await revokeSession(token);
  }

  clearSessionCookie(res);
  sendSuccess(res, { loggedOut: true });
}

export async function postChangePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const input = changePasswordSchema.parse(req.body);
  await changePassword(req.auth!.userId, input);
  sendSuccess(res, { updated: true });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const auth = req.auth;
  if (!auth) {
    throw new Error("getMe called without requireAuth middleware");
  }

  const { shop, user } = await getAuthenticatedShopAndUser(auth.userId);
  sendSuccess(res, serializeAuthUser(user, shop));
}
