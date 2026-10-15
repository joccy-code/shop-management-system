import type { Expense, Prisma } from "@prisma/client";
import { AppError } from "../lib/app-error.js";
import { expenseDateToUtc } from "../lib/dates.js";
import { pageArgs, type Page } from "../lib/pagination.js";
import { prisma } from "../lib/prisma.js";
import type {
  CreateExpenseInput,
  ListExpensesQuery,
  UpdateExpenseInput,
} from "../schemas/expense.schema.js";

async function getExpenseOrThrow(
  shopId: string,
  expenseId: string,
): Promise<Expense> {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, shopId },
  });

  if (!expense) {
    throw new AppError(404, "NOT_FOUND", "Expense not found.");
  }

  return expense;
}

export async function createExpense(
  shopId: string,
  input: CreateExpenseInput,
): Promise<Expense> {
  return prisma.expense.create({
    data: {
      shopId,
      description: input.description,
      category: input.category,
      amount: input.amount,
      expenseDate: expenseDateToUtc(input.expenseDate),
      note: input.note ?? null,
    },
  });
}

export async function listExpenses(
  shopId: string,
  query: ListExpensesQuery,
): Promise<Page<Expense>> {
  const where: Prisma.ExpenseWhereInput = {
    shopId,
    ...(query.includeVoided ? {} : { status: "RECORDED" }),
    ...(query.category ? { category: query.category } : {}),
  };

  if (query.from || query.to) {
    where.expenseDate = {
      ...(query.from ? { gte: expenseDateToUtc(query.from) } : {}),
      ...(query.to ? { lte: expenseDateToUtc(query.to) } : {}),
    };
  }

  const [total, items] = await prisma.$transaction([
    prisma.expense.count({ where }),
    prisma.expense.findMany({
      where,
      orderBy: [{ expenseDate: "desc" }, { createdAt: "desc" }],
      ...pageArgs(query),
    }),
  ]);

  return { items, page: query.page, pageSize: query.pageSize, total };
}

export async function updateExpense(
  shopId: string,
  expenseId: string,
  input: UpdateExpenseInput,
): Promise<Expense> {
  const existing = await getExpenseOrThrow(shopId, expenseId);

  if (existing.status === "VOIDED") {
    throw new AppError(
      409,
      "ALREADY_VOIDED",
      "A voided expense cannot be changed.",
    );
  }

  if (input.status === "RECORDED") {
    throw new AppError(
      400,
      "INVALID_STATUS",
      "Recorded expenses can only be voided.",
    );
  }

  return prisma.expense.update({
    where: { id: existing.id },
    data: {
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.expenseDate !== undefined
        ? { expenseDate: expenseDateToUtc(input.expenseDate) }
        : {}),
      ...(input.note !== undefined ? { note: input.note } : {}),
      ...(input.status === "VOIDED"
        ? { status: "VOIDED", voidedAt: new Date() }
        : {}),
    },
  });
}
