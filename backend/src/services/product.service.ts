import type { InventoryMovement, Prisma, Product } from "@prisma/client";
import { AppError } from "../lib/app-error.js";
import { Decimal } from "../lib/money.js";
import { prisma } from "../lib/prisma.js";
import type {
  CreateCategoryInput,
  CreateProductInput,
  ListProductsQuery,
  StockAdjustmentInput,
  UpdateProductInput,
} from "../schemas/product.schema.js";

async function assertCategoryBelongsToShop(
  shopId: string,
  categoryId: string,
): Promise<void> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, shopId },
  });

  if (!category) {
    throw new AppError(
      400,
      "INVALID_CATEGORY",
      "Select a valid category for this shop.",
    );
  }
}

export function listProducts(shopId: string, query: ListProductsQuery) {
  const where: Prisma.ProductWhereInput = {
    shopId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? { name: { contains: query.search, mode: "insensitive" } }
      : {}),
  };

  return prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductOrThrow(
  shopId: string,
  productId: string,
): Promise<Product> {
  const product = await prisma.product.findFirst({
    where: { id: productId, shopId },
    include: { category: true },
  });

  if (!product) {
    throw new AppError(404, "NOT_FOUND", "Product not found.");
  }

  return product;
}

export async function createProduct(
  shopId: string,
  input: CreateProductInput,
): Promise<Product> {
  if (input.categoryId) {
    await assertCategoryBelongsToShop(shopId, input.categoryId);
  }

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        shopId,
        categoryId: input.categoryId ?? null,
        name: input.name,
        sku: input.sku ?? null,
        sellingPrice: input.sellingPrice,
        unitCost: input.unitCost,
        stockQuantity: input.stockQuantity,
        lowStockThreshold: input.lowStockThreshold,
        unitOfMeasure: input.unitOfMeasure ?? null,
      },
      include: { category: true },
    });

    if (new Decimal(input.stockQuantity).greaterThan(0)) {
      await tx.inventoryMovement.create({
        data: {
          shopId,
          productId: product.id,
          type: "INITIAL",
          quantityChange: input.stockQuantity,
          quantityAfter: input.stockQuantity,
          reason: "Initial stock on hand",
        },
      });
    }

    return product;
  });
}

export async function updateProduct(
  shopId: string,
  productId: string,
  input: UpdateProductInput,
): Promise<Product> {
  await getProductOrThrow(shopId, productId);

  if (input.categoryId) {
    await assertCategoryBelongsToShop(shopId, input.categoryId);
  }

  const data: Prisma.ProductUpdateInput = {};

  if (input.name !== undefined) data.name = input.name;
  if (input.sku !== undefined) data.sku = input.sku;
  if (input.sellingPrice !== undefined) data.sellingPrice = input.sellingPrice;
  if (input.unitCost !== undefined) data.unitCost = input.unitCost;
  if (input.lowStockThreshold !== undefined) {
    data.lowStockThreshold = input.lowStockThreshold;
  }
  if (input.unitOfMeasure !== undefined) {
    data.unitOfMeasure = input.unitOfMeasure;
  }
  if (input.status !== undefined) data.status = input.status;
  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }

  return prisma.product.update({
    where: { id: productId },
    data,
    include: { category: true },
  });
}

export async function archiveProduct(
  shopId: string,
  productId: string,
): Promise<Product> {
  await getProductOrThrow(shopId, productId);

  return prisma.product.update({
    where: { id: productId },
    data: { status: "ARCHIVED" },
    include: { category: true },
  });
}

export type StockAdjustmentResult = {
  product: Product;
  movement: InventoryMovement;
};

export async function adjustStock(
  shopId: string,
  productId: string,
  input: StockAdjustmentInput,
): Promise<StockAdjustmentResult> {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      Array<{ id: string; stock_quantity: Prisma.Decimal | string }>
    >`
      SELECT id, stock_quantity
      FROM products
      WHERE id = ${productId} AND shop_id = ${shopId}
      FOR UPDATE
    `;
    const product = locked[0];

    if (!product) {
      throw new AppError(404, "NOT_FOUND", "Product not found.");
    }

    const change = new Decimal(input.quantityChange);
    const newQuantity = new Decimal(product.stock_quantity).plus(change);

    if (newQuantity.isNegative()) {
      throw new AppError(
        400,
        "INSUFFICIENT_STOCK",
        "This adjustment would make stock negative.",
      );
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newQuantity.toFixed(3) },
      include: { category: true },
    });

    const movement = await tx.inventoryMovement.create({
      data: {
        shopId,
        productId,
        type: "ADJUSTMENT",
        quantityChange: change.toFixed(3),
        quantityAfter: newQuantity.toFixed(3),
        reason: input.reason,
      },
    });

    return { product: updated, movement };
  });
}

export async function listStockMovements(
  shopId: string,
  productId: string,
): Promise<InventoryMovement[]> {
  await getProductOrThrow(shopId, productId);

  return prisma.inventoryMovement.findMany({
    where: { shopId, productId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export function listCategories(shopId: string) {
  return prisma.category.findMany({
    where: { shopId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  shopId: string,
  input: CreateCategoryInput,
) {
  const existing = await prisma.category.findFirst({
    where: { shopId, name: input.name },
  });

  if (existing) {
    return existing;
  }

  return prisma.category.create({
    data: { shopId, name: input.name },
  });
}
