import type { UserRole } from "@prisma/client";

export type AuthContext = {
  userId: string;
  shopId: string;
  role: UserRole;
  displayName: string;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export {};
