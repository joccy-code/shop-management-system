import type {
  Category,
  Customer,
  CustomerRepayment,
  Expense,
  InventoryMovement,
  Product,
} from "@prisma/client";
import { formatExpenseDate } from "./dates.js";
import { Decimal } from "./money.js";
import type { SaleWithRelations } from "../services/sale.service.js";

export type SerializedProduct = {
  id: string;
  shopId: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  name: string;
  sku: string | null;
  sellingPrice: string;
  unitCost: string;
  stockQuantity: string;
  lowStockThreshold: string;
  unitOfMeasure: string | null;
  status: Product["status"];
  createdAt: string;
  updatedAt: string;
};

export function serializeProduct(
  product: Product & { category?: Category | null },
): SerializedProduct {
  return {
    id: product.id,
    shopId: product.shopId,
    categoryId: product.categoryId,
    category: product.category
      ? { id: product.category.id, name: product.category.name }
      : null,
    name: product.name,
    sku: product.sku,
    sellingPrice: new Decimal(product.sellingPrice).toFixed(2),
    unitCost: new Decimal(product.unitCost).toFixed(2),
    stockQuantity: new Decimal(product.stockQuantity).toFixed(3),
    lowStockThreshold: new Decimal(product.lowStockThreshold).toFixed(3),
    unitOfMeasure: product.unitOfMeasure,
    status: product.status,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

export type SerializedInventoryMovement = {
  id: string;
  productId: string;
  type: InventoryMovement["type"];
  quantityChange: string;
  quantityAfter: string;
  reason: string | null;
  createdAt: string;
};

export function serializeInventoryMovement(
  movement: InventoryMovement,
): SerializedInventoryMovement {
  return {
    id: movement.id,
    productId: movement.productId,
    type: movement.type,
    quantityChange: new Decimal(movement.quantityChange).toFixed(3),
    quantityAfter: new Decimal(movement.quantityAfter).toFixed(3),
    reason: movement.reason,
    createdAt: movement.createdAt.toISOString(),
  };
}

export function serializeSale(sale: SaleWithRelations) {
  return {
    id: sale.id,
    receiptNumber: sale.receiptNumber,
    status: sale.status,
    customerId: sale.customerId,
    customerName: sale.customerNameSnapshot ?? sale.customer?.name ?? null,
    subtotal: new Decimal(sale.subtotal).toFixed(2),
    total: new Decimal(sale.total).toFixed(2),
    amountPaid: new Decimal(sale.amountPaid).toFixed(2),
    outstandingBalance: new Decimal(sale.outstandingBalance).toFixed(2),
    paymentMethod: sale.paymentMethod,
    notes: sale.notes,
    soldAt: sale.soldAt.toISOString(),
    voidedAt: sale.voidedAt?.toISOString() ?? null,
    items: sale.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productNameSnapshot,
      unitPrice: new Decimal(item.unitPriceSnapshot).toFixed(2),
      quantity: new Decimal(item.quantity).toFixed(3),
      lineTotal: new Decimal(item.lineTotal).toFixed(2),
    })),
    payments: sale.payments.map((payment) => ({
      id: payment.id,
      method: payment.method,
      amount: new Decimal(payment.amount).toFixed(2),
      status: payment.status,
      paidAt: payment.paidAt.toISOString(),
    })),
  };
}

export function serializeExpense(expense: Expense) {
  return {
    id: expense.id,
    description: expense.description,
    category: expense.category,
    amount: new Decimal(expense.amount).toFixed(2),
    expenseDate: formatExpenseDate(expense.expenseDate),
    note: expense.note,
    status: expense.status,
    voidedAt: expense.voidedAt?.toISOString() ?? null,
    createdAt: expense.createdAt.toISOString(),
  };
}

export function serializeCustomer(
  customer: Customer & { outstandingBalance?: string },
) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    notes: customer.notes,
    outstandingBalance: customer.outstandingBalance ?? "0.00",
    createdAt: customer.createdAt.toISOString(),
  };
}

export function serializeRepayment(repayment: CustomerRepayment) {
  return {
    id: repayment.id,
    saleId: repayment.saleId,
    amount: new Decimal(repayment.amount).toFixed(2),
    method: repayment.method,
    note: repayment.note,
    paidAt: repayment.paidAt.toISOString(),
  };
}
