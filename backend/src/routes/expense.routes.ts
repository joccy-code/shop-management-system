import { Router } from "express";
import {
  getExpenses,
  patchExpense,
  postExpense,
} from "../controllers/expense.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const expenseRouter = Router();

expenseRouter.use(requireAuth);

expenseRouter.get("/expenses", (req, res, next) => {
  void getExpenses(req, res).catch(next);
});

expenseRouter.post("/expenses", (req, res, next) => {
  void postExpense(req, res).catch(next);
});

expenseRouter.patch("/expenses/:id", (req, res, next) => {
  void patchExpense(req, res).catch(next);
});
