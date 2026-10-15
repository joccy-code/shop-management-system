import { Router } from "express";
import {
  getSale,
  getSales,
  postSale,
  postVoidSale,
} from "../controllers/sale.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const saleRouter = Router();

saleRouter.use(requireAuth);

saleRouter.get("/sales", (req, res, next) => {
  void getSales(req, res).catch(next);
});

saleRouter.post("/sales", (req, res, next) => {
  void postSale(req, res).catch(next);
});

saleRouter.get("/sales/:id", (req, res, next) => {
  void getSale(req, res).catch(next);
});

saleRouter.post("/sales/:id/void", (req, res, next) => {
  void postVoidSale(req, res).catch(next);
});
