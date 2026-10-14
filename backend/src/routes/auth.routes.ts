import { Router } from "express";
import {
  getMe,
  postLogin,
  postLogout,
  postRegister,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/auth/register", (req, res, next) => {
  void postRegister(req, res).catch(next);
});

authRouter.post("/auth/login", (req, res, next) => {
  void postLogin(req, res).catch(next);
});

authRouter.post("/auth/logout", (req, res, next) => {
  void postLogout(req, res).catch(next);
});

authRouter.get("/auth/me", requireAuth, (req, res, next) => {
  void getMe(req, res).catch(next);
});
