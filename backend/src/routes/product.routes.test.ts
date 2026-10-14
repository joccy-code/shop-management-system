import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { registerAccount } from "../test/factories.js";

describe("product routes", () => {
  let app: Express;
  let cookie: string;

  beforeEach(async () => {
    app = createApp();
    ({ cookie } = await registerAccount(app));
  });

  it("rejects product access without authentication", async () => {
    const response = await request(app).get("/api/v1/products");
    expect(response.status).toBe(401);
  });

  it("creates a product and records initial stock as an inventory movement", async () => {
    const createResponse = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        name: "Sugar 1kg",
        sellingPrice: "95.50",
        unitCost: "80",
        stockQuantity: "20",
        lowStockThreshold: "5",
        unitOfMeasure: "pc",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      name: "Sugar 1kg",
      sellingPrice: "95.50",
      unitCost: "80.00",
      stockQuantity: "20.000",
      lowStockThreshold: "5.000",
      status: "ACTIVE",
    });

    const productId = createResponse.body.data.id as string;
    const movementsResponse = await request(app)
      .get(`/api/v1/products/${productId}/stock-adjustments`)
      .set("Cookie", cookie);

    expect(movementsResponse.status).toBe(200);
    expect(movementsResponse.body.data).toHaveLength(1);
    expect(movementsResponse.body.data[0]).toMatchObject({
      type: "INITIAL",
      quantityChange: "20.000",
      quantityAfter: "20.000",
    });
  });

  it("rejects a product referencing a category from another shop", async () => {
    const other = await registerAccount(app);
    const categoryResponse = await request(app)
      .post("/api/v1/categories")
      .set("Cookie", other.cookie)
      .send({ name: "Beverages" });
    const foreignCategoryId = categoryResponse.body.data.id as string;

    const response = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        name: "Juice",
        categoryId: foreignCategoryId,
        sellingPrice: "50",
        unitCost: "30",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_CATEGORY");
  });

  it("lists only the current shop's products", async () => {
    await request(app).post("/api/v1/products").set("Cookie", cookie).send({
      name: "Rice 1kg",
      sellingPrice: "60",
      unitCost: "45",
    });

    const other = await registerAccount(app);
    await request(app)
      .post("/api/v1/products")
      .set("Cookie", other.cookie)
      .send({ name: "Other Shop Product", sellingPrice: "10", unitCost: "5" });

    const response = await request(app)
      .get("/api/v1/products")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Rice 1kg");
  });

  it("filters products by search text", async () => {
    await request(app).post("/api/v1/products").set("Cookie", cookie).send({
      name: "Cooking Oil 5L",
      sellingPrice: "500",
      unitCost: "420",
    });
    await request(app).post("/api/v1/products").set("Cookie", cookie).send({
      name: "Teff 50kg",
      sellingPrice: "3500",
      unitCost: "3000",
    });

    const response = await request(app)
      .get("/api/v1/products")
      .query({ search: "oil" })
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Cooking Oil 5L");
  });

  it("updates a product", async () => {
    const createResponse = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ name: "Soap", sellingPrice: "25", unitCost: "18" });
    const productId = createResponse.body.data.id as string;

    const updateResponse = await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set("Cookie", cookie)
      .send({ sellingPrice: "28" });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.sellingPrice).toBe("28.00");
  });

  it("returns 404 when updating a product that belongs to another shop", async () => {
    const createResponse = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ name: "Candles", sellingPrice: "15", unitCost: "9" });
    const productId = createResponse.body.data.id as string;

    const other = await registerAccount(app);
    const response = await request(app)
      .patch(`/api/v1/products/${productId}`)
      .set("Cookie", other.cookie)
      .send({ sellingPrice: "99" });

    expect(response.status).toBe(404);
  });

  it("archives a product instead of deleting it", async () => {
    const createResponse = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({ name: "Matches", sellingPrice: "5", unitCost: "2" });
    const productId = createResponse.body.data.id as string;

    const archiveResponse = await request(app)
      .delete(`/api/v1/products/${productId}`)
      .set("Cookie", cookie);

    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body.data.status).toBe("ARCHIVED");
  });

  it("increases stock through a positive adjustment", async () => {
    const createResponse = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        name: "Bottled Water",
        sellingPrice: "20",
        unitCost: "12",
        stockQuantity: "10",
      });
    const productId = createResponse.body.data.id as string;

    const adjustResponse = await request(app)
      .post(`/api/v1/products/${productId}/stock-adjustments`)
      .set("Cookie", cookie)
      .send({ quantityChange: "15", reason: "New delivery" });

    expect(adjustResponse.status).toBe(201);
    expect(adjustResponse.body.data.product.stockQuantity).toBe("25.000");
    expect(adjustResponse.body.data.movement).toMatchObject({
      type: "ADJUSTMENT",
      quantityChange: "15.000",
      quantityAfter: "25.000",
      reason: "New delivery",
    });
  });

  it("decreases stock through a negative adjustment", async () => {
    const createResponse = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        name: "Cooking Gas",
        sellingPrice: "1200",
        unitCost: "950",
        stockQuantity: "5",
      });
    const productId = createResponse.body.data.id as string;

    const adjustResponse = await request(app)
      .post(`/api/v1/products/${productId}/stock-adjustments`)
      .set("Cookie", cookie)
      .send({ quantityChange: "-2", reason: "Damaged in storage" });

    expect(adjustResponse.status).toBe(201);
    expect(adjustResponse.body.data.product.stockQuantity).toBe("3.000");
  });

  it("rejects a stock adjustment that would make stock negative", async () => {
    const createResponse = await request(app)
      .post("/api/v1/products")
      .set("Cookie", cookie)
      .send({
        name: "Flour 1kg",
        sellingPrice: "45",
        unitCost: "35",
        stockQuantity: "2",
      });
    const productId = createResponse.body.data.id as string;

    const adjustResponse = await request(app)
      .post(`/api/v1/products/${productId}/stock-adjustments`)
      .set("Cookie", cookie)
      .send({ quantityChange: "-5", reason: "Stock count correction" });

    expect(adjustResponse.status).toBe(400);
    expect(adjustResponse.body.error.code).toBe("INSUFFICIENT_STOCK");
  });

  it("creates and lists categories scoped to the current shop", async () => {
    await request(app)
      .post("/api/v1/categories")
      .set("Cookie", cookie)
      .send({ name: "Snacks" });

    const response = await request(app)
      .get("/api/v1/categories")
      .set("Cookie", cookie);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe("Snacks");
  });
});
