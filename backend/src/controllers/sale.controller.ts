import type { Request, Response } from "express";
import { AppError } from "../lib/app-error.js";
import { sendSuccess } from "../lib/api-response.js";
import { serializeSale } from "../lib/serialize.js";
import {
  createSaleSchema,
  listSalesQuerySchema,
  voidSaleSchema,
} from "../schemas/sale.schema.js";
import {
  createSale,
  getSaleOrThrow,
  listSales,
  voidSale,
} from "../services/sale.service.js";

function shopId(req: Request): string {
  return req.auth!.shopId;
}

function idempotencyKey(req: Request): string | null {
  const key = req.get("Idempotency-Key")?.trim();
  if (!key) {
    return null;
  }
  if (key.length > 80) {
    throw new AppError(
      400,
      "INVALID_IDEMPOTENCY_KEY",
      "Idempotency-Key must be 80 characters or fewer.",
    );
  }
  return key;
}

export async function getSales(req: Request, res: Response): Promise<void> {
  const query = listSalesQuerySchema.parse(req.query);
  const page = await listSales(shopId(req), query);
  sendSuccess(res, {
    ...page,
    items: page.items.map(serializeSale),
  });
}

export async function postSale(req: Request, res: Response): Promise<void> {
  const input = createSaleSchema.parse(req.body);
  const result = await createSale(
    shopId(req),
    req.auth!.userId,
    input,
    idempotencyKey(req),
  );
  sendSuccess(
    res,
    { sale: serializeSale(result.sale), replayed: result.replayed },
    result.replayed ? 200 : 201,
  );
}

export async function getSale(req: Request, res: Response): Promise<void> {
  const sale = await getSaleOrThrow(shopId(req), req.params.id as string);
  sendSuccess(res, serializeSale(sale));
}

export async function postVoidSale(req: Request, res: Response): Promise<void> {
  const input = voidSaleSchema.parse(req.body ?? {});
  const sale = await voidSale(shopId(req), req.params.id as string, input);
  sendSuccess(res, serializeSale(sale));
}
