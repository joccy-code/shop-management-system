import { api } from "@/lib/api";
import type { AuthUser } from "./types";

export type RegisterPayload = {
  shopName: string;
  displayName: string;
  phone: string;
  password: string;
};

export type LoginPayload = {
  phone: string;
  password: string;
};

export function fetchCurrentUser(): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me");
}

export function registerAccount(payload: RegisterPayload): Promise<AuthUser> {
  return api.post<AuthUser>("/auth/register", payload);
}

export function login(payload: LoginPayload): Promise<AuthUser> {
  return api.post<AuthUser>("/auth/login", payload);
}

export function logout(): Promise<{ loggedOut: boolean }> {
  return api.post<{ loggedOut: boolean }>("/auth/logout");
}
