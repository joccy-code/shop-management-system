import { Router } from "express";
import {
  deleteProduct,
  getProduct,
  getProducts,
  getStockMovements,
  patchProduct,
  postProduct,
  postStockAdjustment,
} from "../controllers/product.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const productRouter = Router();

productRouter.use(requireAuth);

productRouter.get("/products", (req, res, next) => {
  void getProducts(req, res).catch(next);
});

productRouter.post("/products", (req, res, next) => {
  void postProduct(req, res).catch(next);
});

productRouter.get("/products/:id", (req, res, next) => {
  void getProduct(req, res).catch(next);
});

productRouter.patch("/products/:id", (req, res, next) => {
  void patchProduct(req, res).catch(next);
});

productRouter.delete("/products/:id", (req, res, next) => {
  void deleteProduct(req, res).catch(next);
});

productRouter.get("/products/:id/stock-adjustments", (req, res, next) => {
  void getStockMovements(req, res).catch(next);
});

productRouter.post("/products/:id/stock-adjustments", (req, res, next) => {
  void postStockAdjustment(req, res).catch(next);
});
