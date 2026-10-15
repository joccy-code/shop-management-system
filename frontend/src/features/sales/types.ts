export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "TELEBIRR"
  | "OTHER"
  | "CREDIT";

export type SaleStatus = "COMPLETED" | "PARTIALLY_PAID" | "UNPAID" | "VOIDED";

export type Sale = {
  id: string;
  receiptNumber: string;
  status: SaleStatus;
  customerId: string | null;
  customerName: string | null;
  subtotal: string;
  total: string;
  amountPaid: string;
  outstandingBalance: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  soldAt: string;
  voidedAt: string | null;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    unitPrice: string;
    quantity: string;
    lineTotal: string;
  }>;
  payments: Array<{
    id: string;
    method: PaymentMethod;
    amount: string;
    status: "RECORDED" | "VOIDED";
    paidAt: string;
  }>;
};

export type SalePage = {
  items: Sale[];
  page: number;
  pageSize: number;
  total: number;
};

export type CreateSaleResult = {
  sale: Sale;
  replayed: boolean;
};
