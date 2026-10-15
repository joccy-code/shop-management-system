import { api } from "@/lib/api";
import type { CreateSaleResult, Sale, SalePage } from "./types";

export type CreateSalePayload = {
  items: Array<{ productId: string; quantity: string }>;
  paymentMethod: string;
  amountPaid: string;
  customerId?: string | null;
  notes?: string | null;
};

export function listSales(): Promise<SalePage> {
  return api.get<SalePage>("/sales?pageSize=20");
}

export function createSale(
  payload: CreateSalePayload,
  idempotencyKey: string,
): Promise<CreateSaleResult> {
  return api.post<CreateSaleResult>("/sales", payload, {
    "Idempotency-Key": idempotencyKey,
  });
}

export function voidSale(saleId: string, reason: string): Promise<Sale> {
  return api.post<Sale>(`/sales/${saleId}/void`, { reason });
}
