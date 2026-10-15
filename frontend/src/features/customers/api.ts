import { api } from "@/lib/api";
import type { Sale } from "@/features/sales/types";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  outstandingBalance: string;
};

export type CustomerPage = {
  items: Customer[];
  page: number;
  pageSize: number;
  total: number;
};

export type Repayment = {
  id: string;
  saleId: string;
  amount: string;
  method: string;
  note: string | null;
  paidAt: string;
};

export type CustomerDetail = Customer & {
  sales: Sale[];
  repayments: Repayment[];
};

export function listCustomers(search?: string): Promise<CustomerPage> {
  const params = new URLSearchParams({ pageSize: "50" });
  if (search) {
    params.set("search", search);
  }
  return api.get<CustomerPage>(`/customers?${params.toString()}`);
}

export function createCustomer(payload: {
  name: string;
  phone?: string | null;
  notes?: string | null;
}): Promise<Customer> {
  return api.post<Customer>("/customers", payload);
}

export function getCustomer(customerId: string): Promise<CustomerDetail> {
  return api.get<CustomerDetail>(`/customers/${customerId}`);
}

export function recordRepayment(
  customerId: string,
  payload: { saleId: string; amount: string; method: string; note?: string | null },
): Promise<{ sale: Sale; outstandingBalance: string }> {
  return api.post(`/customers/${customerId}/repayments`, payload);
}
