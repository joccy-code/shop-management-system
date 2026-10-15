import { Router } from "express";
import {
  getCustomer,
  getCustomers,
  patchCustomer,
  postCustomer,
  postRepayment,
} from "../controllers/customer.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const customerRouter = Router();

customerRouter.use(requireAuth);

customerRouter.get("/customers", (req, res, next) => {
  void getCustomers(req, res).catch(next);
});

customerRouter.post("/customers", (req, res, next) => {
  void postCustomer(req, res).catch(next);
});

customerRouter.get("/customers/:id", (req, res, next) => {
  void getCustomer(req, res).catch(next);
});

customerRouter.patch("/customers/:id", (req, res, next) => {
  void patchCustomer(req, res).catch(next);
});

customerRouter.post("/customers/:id/repayments", (req, res, next) => {
  void postRepayment(req, res).catch(next);
});
