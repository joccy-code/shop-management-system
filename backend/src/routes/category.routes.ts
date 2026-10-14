import { Router } from "express";
import {
  getCategories,
  postCategory,
} from "../controllers/category.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const categoryRouter = Router();

categoryRouter.use(requireAuth);

categoryRouter.get("/categories", (req, res, next) => {
  void getCategories(req, res).catch(next);
});

categoryRouter.post("/categories", (req, res, next) => {
  void postCategory(req, res).catch(next);
});
