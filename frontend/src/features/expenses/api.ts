import { api } from "@/lib/api";

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: string;
  expenseDate: string;
  note: string | null;
  status: "RECORDED" | "VOIDED";
  voidedAt: string | null;
};

export type ExpensePage = {
  items: Expense[];
  page: number;
  pageSize: number;
  total: number;
};

export type ExpensePayload = {
  description: string;
  category: string;
  amount: string;
  expenseDate: string;
  note?: string | null;
};

export function listExpenses(): Promise<ExpensePage> {
  return api.get<ExpensePage>("/expenses?pageSize=50");
}

export function createExpense(payload: ExpensePayload): Promise<Expense> {
  return api.post<Expense>("/expenses", payload);
}

export function voidExpense(expenseId: string): Promise<Expense> {
  return api.patch<Expense>(`/expenses/${expenseId}`, { status: "VOIDED" });
}
