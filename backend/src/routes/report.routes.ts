import { Router } from "express";
import {
  getCustomerBalances,
  getDashboard,
  getExpensesReport,
  getInventoryReport,
  getSalesReport,
} from "../controllers/report.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const reportRouter = Router();

reportRouter.use(requireAuth);

reportRouter.get("/reports/dashboard", (req, res, next) => {
  void getDashboard(req, res).catch(next);
});

reportRouter.get("/reports/sales", (req, res, next) => {
  void getSalesReport(req, res).catch(next);
});

reportRouter.get("/reports/expenses", (req, res, next) => {
  void getExpensesReport(req, res).catch(next);
});

reportRouter.get("/reports/inventory", (req, res, next) => {
  void getInventoryReport(req, res).catch(next);
});

reportRouter.get("/reports/customer-balances", (req, res, next) => {
  void getCustomerBalances(req, res).catch(next);
});
