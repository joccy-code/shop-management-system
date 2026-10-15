import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import type { Express } from "express";
import { createApp } from "../app.js";
import { registerAccount } from "../test/factories.js";

async function createProduct(
  app: Express,
  cookie: string,
  overrides: Record<string, string> = {},
) {
  const response = await request(app)
    .post("/api/v1/products")
    .set("Cookie", cookie)
    .send({
      name: "Rice 1kg",
      sellingPrice: "100.00",
      unitCost: "70.00",
      stockQuantity: "10",
      lowStockThreshold: "2",
      ...overrides,
    });

  expect(response.status).toBe(201);
  return response.body.data as { id: string; stockQuantity: string };
}

describe("sales, expenses, credit, and reports", () => {
  let app: Express;
  let cookie: string;

  beforeEach(async () => {
    app = createApp();
    ({ cookie } = await registerAccount(app));
  });

  it("records a cash sale, reduces stock once, and ignores a duplicate submit", async () => {
    const product = await createProduct(app, cookie);
    const payload = {
      items: [{ productId: product.id, quantity: "2" }],
      paymentMethod: "CASH",
      amountPaid: "200.00",
    };

    const created = await request(app)
      .post("/api/v1/sales")
      .set("Cookie", cookie)
      .set("Idempotency-Key", "checkout-1")
      .send(payload);

    expect(created.status).toBe(201);
    expect(created.body.data.replayed).toBe(false);
    expect(created.body.data.sale).toMatchObject({
      status: "COMPLETED",
      total: "200.00",
      amountPaid: "200.00",
      outstandingBalance: "0.00",
      paymentMethod: "CASH",
    });
    expect(created.body.data.sale.receiptNumber).toMatch(/^SM-\d{6}$/);
    expect(created.body.data.sale.items[0]).toMatchObject({
      name: "Rice 1kg",
      unitPrice: "100.00",
      quantity: "2.000",
      lineTotal: "200.00",
    });

    const replay = await request(app)
      .post("/api/v1/sales")
      .set("Cookie", cookie)
      .set("Idempotency-Key", "checkout-1")
      .send(payload);
    expect(replay.status).toBe(200);
    expect(replay.body.data.replayed).toBe(true);
    expect(replay.body.data.sale.id).toBe(created.body.data.sale.id);

    const stock = await request(app)
      .get(`/api/v1/products/${product.id}`)
      .set("Cookie", cookie);
    expect(stock.body.data.stockQuantity).toBe("8.000");
  });

  it("rolls back the whole sale when a later line does not have enough stock", async () => {
    const first = await createProduct(app, cookie, { name: "Oil", stockQuantity: "5" });
    const second = await createProduct(app, cookie, {
      name: "Salt",
      stockQuantity: "1",
    });

    const response = await request(app)
      .post("/api/v1/sales")
      .set("Cookie", cookie)
      .send({
        items: [
          { productId: first.id, quantity: "1" },
          { productId: second.id, quantity: "4" },
        ],
        paymentMethod: "CASH",
        amountPaid: "500",
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("INSUFFICIENT_STOCK");

    const firstStock = await request(app)
      .get(`/api/v1/products/${first.id}`)
      .set("Cookie", cookie);
    expect(firstStock.body.data.stockQuantity).toBe("5.000");

    const sales = await request(app).get("/api/v1/sales").set("Cookie", cookie);
    expect(sales.body.data.total).toBe(0);
  });

  it("rejects a product that belongs to another shop", async () => {
    const other = await registerAccount(app);
    const foreign = await createProduct(app, other.cookie);

    const response = await request(app)
      .post("/api/v1/sales")
      .set("Cookie", cookie)
      .send({
        items: [{ productId: foreign.id, quantity: "1" }],
        paymentMethod: "CASH",
        amountPaid: "100",
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_PRODUCT");
  });

  it("requires a customer for credit and rejects an oversized repayment", async () => {
    const product = await createProduct(app, cookie, { stockQuantity: "4" });
    const missingCustomer = await request(app)
      .post("/api/v1/sales")
      .set("Cookie", cookie)
      .send({
        items: [{ productId: product.id, quantity: "1" }],
        paymentMethod: "CREDIT",
        amountPaid: "0",
      });
    expect(missingCustomer.status).toBe(400);
    expect(missingCustomer.body.error.code).toBe("CUSTOMER_REQUIRED");

    const customer = await request(app)
      .post("/api/v1/customers")
      .set("Cookie", cookie)
      .send({ name: "Abebe Kebede", phone: "0911223344" });
    expect(customer.status).toBe(201);

    const sale = await request(app)
      .post("/api/v1/sales")
      .set("Cookie", cookie)
      .send({
        items: [{ productId: product.id, quantity: "2" }],
        paymentMethod: "CASH",
        amountPaid: "50",
        customerId: customer.body.data.id,
      });
    expect(sale.status).toBe(201);
    expect(sale.body.data.sale.status).toBe("PARTIALLY_PAID");
    expect(sale.body.data.sale.outstandingBalance).toBe("150.00");

    const tooMuch = await request(app)
      .post(`/api/v1/customers/${customer.body.data.id}/repayments`)
      .set("Cookie", cookie)
      .send({
        saleId: sale.body.data.sale.id,
        amount: "151",
        method: "CASH",
      });
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.error.code).toBe("REPAYMENT_TOO_LARGE");

    const blocked = await request(app)
      .delete(`/api/v1/customers/${customer.body.data.id}`)
      .set("Cookie", cookie);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.code).toBe("CUSTOMER_HAS_BALANCE");

    const paid = await request(app)
      .post(`/api/v1/customers/${customer.body.data.id}/repayments`)
      .set("Cookie", cookie)
      .send({
        saleId: sale.body.data.sale.id,
        amount: "150.00",
        method: "TELEBIRR",
      });
    expect(paid.status).toBe(201);
    expect(paid.body.data.sale.status).toBe("COMPLETED");
    expect(paid.body.data.outstandingBalance).toBe("0.00");

    const detail = await request(app)
      .get(`/api/v1/customers/${customer.body.data.id}`)
      .set("Cookie", cookie);
    expect(detail.body.data.repayments).toHaveLength(1);
    expect(detail.body.data.phone).toBe("+251911223344");

    const removed = await request(app)
      .delete(`/api/v1/customers/${customer.body.data.id}`)
      .set("Cookie", cookie);
    expect(removed.status).toBe(200);

    const listed = await request(app)
      .get("/api/v1/customers")
      .set("Cookie", cookie);
    expect(listed.body.data.items).toEqual([]);

    const saleAfter = await request(app)
      .get(`/api/v1/sales/${sale.body.data.sale.id}`)
      .set("Cookie", cookie);
    expect(saleAfter.body.data.customerName).toBe("Abebe Kebede");
  });

  it("voids a sale and restores stock, then excludes it from revenue", async () => {
    const product = await createProduct(app, cookie, { stockQuantity: "6" });
    const sale = await request(app)
      .post("/api/v1/sales")
      .set("Cookie", cookie)
      .send({
        items: [{ productId: product.id, quantity: "1.5" }],
        paymentMethod: "TELEBIRR",
        amountPaid: "150",
      });
    const saleId = sale.body.data.sale.id as string;

    const voided = await request(app)
      .post(`/api/v1/sales/${saleId}/void`)
      .set("Cookie", cookie)
      .send({ reason: "Wrong item" });
    expect(voided.status).toBe(200);
    expect(voided.body.data.status).toBe("VOIDED");
    expect(voided.body.data.payments[0].status).toBe("VOIDED");

    const stock = await request(app)
      .get(`/api/v1/products/${product.id}`)
      .set("Cookie", cookie);
    expect(stock.body.data.stockQuantity).toBe("6.000");

    const dashboard = await request(app)
      .get("/api/v1/reports/dashboard")
      .set("Cookie", cookie);
    expect(dashboard.body.data.salesToday).toBe("0.00");
    expect(dashboard.body.data.revenueInPeriod).toBe("0.00");
  });

  it("keeps voided expenses out of the default list and the profit estimate", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const created = await request(app)
      .post("/api/v1/expenses")
      .set("Cookie", cookie)
      .send({
        description: "Shop rent",
        category: "rent",
        amount: "5000",
        expenseDate: today,
      });
    expect(created.status).toBe(201);

    const product = await createProduct(app, cookie, {
      sellingPrice: "100",
      unitCost: "40",
      stockQuantity: "3",
    });
    await request(app)
      .post("/api/v1/sales")
      .set("Cookie", cookie)
      .send({
        items: [{ productId: product.id, quantity: "1" }],
        paymentMethod: "CASH",
        amountPaid: "100",
      });

    const before = await request(app)
      .get("/api/v1/reports/dashboard")
      .set("Cookie", cookie);
    expect(before.body.data.expensesToday).toBe("5000.00");
    expect(before.body.data.estimatedGrossProfit).toBe("60.00");
    expect(before.body.data.estimatedNetProfit).toBe("-4940.00");
    expect(before.body.data.collectedInPeriod).toBe("100.00");

    const voided = await request(app)
      .patch(`/api/v1/expenses/${created.body.data.id}`)
      .set("Cookie", cookie)
      .send({ status: "VOIDED" });
    expect(voided.status).toBe(200);

    const listed = await request(app)
      .get("/api/v1/expenses")
      .set("Cookie", cookie);
    expect(listed.body.data.total).toBe(0);

    const after = await request(app)
      .get("/api/v1/reports/dashboard")
      .set("Cookie", cookie);
    expect(after.body.data.expensesToday).toBe("0.00");
    expect(after.body.data.estimatedNetProfit).toBe("60.00");
    expect(after.body.data.lowStockCount).toBe(1);
  });

  it("does not show another shop's sales or expenses", async () => {
    const other = await registerAccount(app);
    const product = await createProduct(app, other.cookie);
    await request(app)
      .post("/api/v1/sales")
      .set("Cookie", other.cookie)
      .send({
        items: [{ productId: product.id, quantity: "1" }],
        paymentMethod: "CASH",
        amountPaid: "100",
      });
    await request(app)
      .post("/api/v1/expenses")
      .set("Cookie", other.cookie)
      .send({
        description: "Transport",
        category: "transport",
        amount: "40",
        expenseDate: "2026-10-15",
      });

    const sales = await request(app).get("/api/v1/sales").set("Cookie", cookie);
    const expenses = await request(app)
      .get("/api/v1/expenses")
      .set("Cookie", cookie);
    const balances = await request(app)
      .get("/api/v1/reports/customer-balances")
      .set("Cookie", cookie);

    expect(sales.body.data.total).toBe(0);
    expect(expenses.body.data.total).toBe(0);
    expect(balances.body.data.totalOutstanding).toBe("0.00");
  });
});
