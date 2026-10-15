import type { Request, Response } from "express";
import { sendSuccess } from "../lib/api-response.js";
import { reportRangeSchema } from "../schemas/report.schema.js";
import {
  customerBalanceReport,
  dashboardReport,
  expensesReport,
  inventoryReport,
  salesReport,
} from "../services/report.service.js";

function shopId(req: Request): string {
  return req.auth!.shopId;
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  const query = reportRangeSchema.parse(req.query);
  sendSuccess(res, await dashboardReport(shopId(req), query));
}

export async function getSalesReport(req: Request, res: Response): Promise<void> {
  const query = reportRangeSchema.parse(req.query);
  sendSuccess(res, await salesReport(shopId(req), query));
}

export async function getExpensesReport(
  req: Request,
  res: Response,
): Promise<void> {
  const query = reportRangeSchema.parse(req.query);
  sendSuccess(res, await expensesReport(shopId(req), query));
}

export async function getInventoryReport(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await inventoryReport(shopId(req)));
}

export async function getCustomerBalances(
  req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, await customerBalanceReport(shopId(req)));
}
