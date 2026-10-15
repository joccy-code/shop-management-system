import { Router } from "express";
import {
  getMe,
  postChangePassword,
  postLogin,
  postLogout,
  postRegister,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

const authAttempts = rateLimit({
  name: "auth",
  limit: 10,
  windowMs: 15 * 60 * 1000,
});

export const authRouter = Router();

authRouter.post("/auth/register", authAttempts, (req, res, next) => {
  void postRegister(req, res).catch(next);
});

authRouter.post("/auth/login", authAttempts, (req, res, next) => {
  void postLogin(req, res).catch(next);
});

authRouter.post("/auth/logout", (req, res, next) => {
  void postLogout(req, res).catch(next);
});

authRouter.get("/auth/me", requireAuth, (req, res, next) => {
  void getMe(req, res).catch(next);
});

authRouter.post("/auth/change-password", requireAuth, (req, res, next) => {
  void postChangePassword(req, res).catch(next);
});
