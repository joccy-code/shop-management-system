import type { Request, Response } from "express";
import { sendSuccess } from "../lib/api-response.js";
import {
  serializeInventoryMovement,
  serializeProduct,
} from "../lib/serialize.js";
import {
  listProductsQuerySchema,
  createProductSchema,
  stockAdjustmentSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import {
  adjustStock,
  archiveProduct,
  createProduct,
  getProductOrThrow,
  listProducts,
  listStockMovements,
  updateProduct,
} from "../services/product.service.js";

function shopId(req: Request): string {
  return req.auth!.shopId;
}

export async function getProducts(req: Request, res: Response): Promise<void> {
  const query = listProductsQuerySchema.parse(req.query);
  const products = await listProducts(shopId(req), query);
  sendSuccess(res, products.map(serializeProduct));
}

export async function postProduct(req: Request, res: Response): Promise<void> {
  const input = createProductSchema.parse(req.body);
  const product = await createProduct(shopId(req), input);
  sendSuccess(res, serializeProduct(product), 201);
}

export async function getProduct(req: Request, res: Response): Promise<void> {
  const product = await getProductOrThrow(shopId(req), req.params.id as string);
  sendSuccess(res, serializeProduct(product));
}

export async function patchProduct(req: Request, res: Response): Promise<void> {
  const input = updateProductSchema.parse(req.body);
  const product = await updateProduct(
    shopId(req),
    req.params.id as string,
    input,
  );
  sendSuccess(res, serializeProduct(product));
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  const product = await archiveProduct(shopId(req), req.params.id as string);
  sendSuccess(res, serializeProduct(product));
}

export async function getStockMovements(
  req: Request,
  res: Response,
): Promise<void> {
  const movements = await listStockMovements(
    shopId(req),
    req.params.id as string,
  );
  sendSuccess(res, movements.map(serializeInventoryMovement));
}

export async function postStockAdjustment(
  req: Request,
  res: Response,
): Promise<void> {
  const input = stockAdjustmentSchema.parse(req.body);
  const result = await adjustStock(shopId(req), req.params.id as string, input);
  sendSuccess(
    res,
    {
      product: serializeProduct(result.product),
      movement: serializeInventoryMovement(result.movement),
    },
    201,
  );
}
