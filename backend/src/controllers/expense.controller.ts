import type { Request, Response } from "express";
import { sendSuccess } from "../lib/api-response.js";
import { serializeExpense } from "../lib/serialize.js";
import {
  createExpenseSchema,
  listExpensesQuerySchema,
  updateExpenseSchema,
} from "../schemas/expense.schema.js";
import {
  createExpense,
  listExpenses,
  updateExpense,
} from "../services/expense.service.js";

function shopId(req: Request): string {
  return req.auth!.shopId;
}

export async function getExpenses(req: Request, res: Response): Promise<void> {
  const query = listExpensesQuerySchema.parse(req.query);
  const page = await listExpenses(shopId(req), query);
  sendSuccess(res, {
    ...page,
    items: page.items.map(serializeExpense),
  });
}

export async function postExpense(req: Request, res: Response): Promise<void> {
  const input = createExpenseSchema.parse(req.body);
  const expense = await createExpense(shopId(req), input);
  sendSuccess(res, serializeExpense(expense), 201);
}

export async function patchExpense(req: Request, res: Response): Promise<void> {
  const input = updateExpenseSchema.parse(req.body);
  const expense = await updateExpense(
    shopId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, serializeExpense(expense));
}
