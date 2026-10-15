import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { createExpense, listExpenses, voidExpense } from "@/features/expenses/api";
import { t, useMessages } from "@/i18n";
import { ApiError } from "@/lib/api";
import { formatMoney, todayInputValue } from "@/lib/format";

const CATEGORIES = [
  "rent",
  "transport",
  "utilities",
  "wages",
  "supplies",
  "other",
] as const;

export function ExpensesPage() {
  useMessages();
  const messages = t().expenses;
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("rent");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayInputValue);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const expensesQuery = useQuery({
    queryKey: ["expenses"],
    queryFn: listExpenses,
  });

  const save = async () => {
    setPageError(null);
    setSubmitting(true);
    try {
      await createExpense({
        description,
        category,
        amount,
        expenseDate,
        note: note || null,
      });
      setDescription("");
      setAmount("");
      setNote("");
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (error) {
      setPageError(
        error instanceof ApiError ? error.message : t().common.saveError,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const voidOne = async (expenseId: string) => {
    if (!window.confirm(messages.voidConfirm)) {
      return;
    }
    setPageError(null);
    try {
      await voidExpense(expenseId);
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (error) {
      setPageError(
        error instanceof ApiError ? error.message : t().common.saveError,
      );
    }
  };

  const expenses = expensesQuery.data?.items ?? [];

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />
      {pageError ? (
        <p role="alert" className="text-sm text-danger-600">
          {pageError}
        </p>
      ) : null}

      <form
        className="space-y-4 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <Input
          label={messages.description}
          value={description}
          required
          onChange={(event) => setDescription(event.target.value)}
        />
        <Select
          label={messages.category}
          value={category}
          onChange={(event) =>
            setCategory(event.target.value as (typeof CATEGORIES)[number])
          }
        >
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {messages.categories[item]}
            </option>
          ))}
        </Select>
        <Input
          label={messages.amount}
          inputMode="decimal"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          label={messages.date}
          type="date"
          required
          value={expenseDate}
          onChange={(event) => setExpenseDate(event.target.value)}
        />
        <Input
          label={messages.note}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? t().common.saving : messages.add}
        </Button>
      </form>

      {expensesQuery.isLoading ? (
        <p className="text-sm text-ink-500">{t().common.loading}</p>
      ) : expenses.length === 0 ? (
        <EmptyState title={messages.emptyTitle} description={messages.emptyBody} />
      ) : (
        <ul className="space-y-2">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-ink-300/70 bg-white px-4 py-3 shadow-soft"
            >
              <div>
                <p className="font-semibold text-ink-900">{expense.description}</p>
                <p className="text-sm text-ink-500">
                  {messages.categories[expense.category as keyof typeof messages.categories] ??
                    expense.category}{" "}
                  · {expense.expenseDate} · {formatMoney(expense.amount)}
                </p>
              </div>
              <Button variant="ghost" onClick={() => void voidOne(expense.id)}>
                {messages.void}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
