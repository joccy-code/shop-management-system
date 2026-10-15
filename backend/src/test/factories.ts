import { randomInt } from "node:crypto";
import request from "supertest";
import type { Express } from "express";

export function uniquePhone(): string {
  const digits = Array.from({ length: 9 }, () => randomInt(0, 10)).join("");
  return `0${digits}`;
}

export function uniqueShopName(label: string): string {
  return `${label} ${randomInt(100000, 999999)}`;
}

type RegisteredAccount = {
  cookie: string;
  phone: string;
  password: string;
  shopName: string;
};

export async function registerAccount(
  app: Express,
  overrides: Partial<{
    shopName: string;
    displayName: string;
    phone: string;
    password: string;
  }> = {},
): Promise<RegisteredAccount> {
  const shopName = overrides.shopName ?? uniqueShopName("Test Shop");
  const displayName = overrides.displayName ?? "Test Owner";
  const phone = overrides.phone ?? uniquePhone();
  const password = overrides.password ?? "correct-horse-battery";

  const response = await request(app)
    .post("/api/v1/auth/register")
    .send({ shopName, displayName, phone, password });

  if (response.status !== 201) {
    throw new Error(
      `Failed to register test account: ${JSON.stringify(response.body)}`,
    );
  }

  const setCookie = response.headers["set-cookie"];
  const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;

  if (!cookie) {
    throw new Error("Register response did not set a session cookie.");
  }

  return { cookie, phone, password, shopName };
}
