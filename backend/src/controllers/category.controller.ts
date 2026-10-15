import type { Request, Response } from "express";
import { sendSuccess } from "../lib/api-response.js";
import { createCategorySchema } from "../schemas/product.schema.js";
import { createCategory, listCategories } from "../services/product.service.js";

export async function getCategories(req: Request, res: Response): Promise<void> {
  const categories = await listCategories(req.auth!.shopId);
  sendSuccess(res, categories);
}

export async function postCategory(req: Request, res: Response): Promise<void> {
  const input = createCategorySchema.parse(req.body);
  const category = await createCategory(req.auth!.shopId, input);
  sendSuccess(res, category, 201);
}
