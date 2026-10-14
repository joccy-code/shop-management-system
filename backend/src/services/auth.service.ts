import type { Shop, User } from "@prisma/client";
import type { AuthContext } from "../types/express.js";
import { AppError } from "../lib/app-error.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import {
  createSessionToken,
  hashToken,
  type SessionToken,
} from "../lib/session-token.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";

export type AuthenticatedUser = {
  shop: Shop;
  user: User;
};

export type SessionRequestInfo = {
  ipAddress?: string | null | undefined;
  userAgent?: string | null | undefined;
};

export async function registerShopOwner(
  input: RegisterInput,
): Promise<AuthenticatedUser> {
  const existing = await prisma.user.findUnique({
    where: { phone: input.phone },
  });

  if (existing) {
    throw new AppError(
      409,
      "PHONE_TAKEN",
      "An account with this phone number already exists.",
    );
  }

  const passwordHash = await hashPassword(input.password);

  const { shop, user } = await prisma.$transaction(async (tx) => {
    const createdShop = await tx.shop.create({
      data: { name: input.shopName },
    });

    const createdUser = await tx.user.create({
      data: {
        shopId: createdShop.id,
        phone: input.phone,
        passwordHash,
        displayName: input.displayName,
        role: "OWNER",
      },
    });

    return { shop: createdShop, user: createdUser };
  });

  return { shop, user };
}

export async function authenticate(
  input: LoginInput,
): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({
    where: { phone: input.phone },
    include: { shop: true },
  });

  if (!user || !user.isActive) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid phone number or password.",
    );
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid phone number or password.",
    );
  }

  return { shop: user.shop, user };
}

export async function createSession(
  userId: string,
  info: SessionRequestInfo = {},
): Promise<SessionToken> {
  const session = createSessionToken();

  await prisma.session.create({
    data: {
      userId,
      tokenHash: session.tokenHash,
      expiresAt: session.expiresAt,
      ipAddress: info.ipAddress ?? null,
      userAgent: info.userAgent ?? null,
    },
  });

  return session;
}

export async function revokeSession(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function resolveSession(
  rawToken: string | undefined,
): Promise<AuthContext | null> {
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  if (!session.user.isActive) {
    return null;
  }

  return {
    userId: session.user.id,
    shopId: session.user.shopId,
    role: session.user.role,
    displayName: session.user.displayName,
  };
}

export async function getAuthenticatedShopAndUser(
  userId: string,
): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { shop: true },
  });

  if (!user) {
    throw new AppError(401, "AUTH_REQUIRED", "Sign in to continue.");
  }

  return { shop: user.shop, user };
}
