import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import {
  createCustomer,
  getCustomer,
  listCustomers,
  recordRepayment,
} from "@/features/customers/api";
import { t } from "@/i18n";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";

export function CustomersPage() {
  const messages = t().customers;
  const salesMessages = t().sales;
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saleId, setSaleId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [pageError, setPageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const customersQuery = useQuery({
    queryKey: ["customers", search],
    queryFn: () => listCustomers(search || undefined),
  });

  const detailQuery = useQuery({
    queryKey: ["customer", selectedId],
    queryFn: () => getCustomer(selectedId!),
    enabled: Boolean(selectedId),
  });

  const saveCustomer = async () => {
    setPageError(null);
    setSubmitting(true);
    try {
      const created = await createCustomer({
        name,
        phone: phone || null,
        notes: notes || null,
      });
      setName("");
      setPhone("");
      setNotes("");
      setSelectedId(created.id);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (error) {
      setPageError(error instanceof ApiError ? error.message : t().common.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const saveRepayment = async () => {
    if (!selectedId || !saleId) {
      return;
    }
    setPageError(null);
    setSubmitting(true);
    try {
      await recordRepayment(selectedId, { saleId, amount, method });
      setAmount("");
      setSaleId("");
      await queryClient.invalidateQueries({ queryKey: ["customer", selectedId] });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
    } catch (error) {
      setPageError(error instanceof ApiError ? error.message : t().common.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const customers = customersQuery.data?.items ?? [];
  const detail = detailQuery.data;
  const openSales =
    detail?.sales.filter(
      (sale) => sale.status === "UNPAID" || sale.status === "PARTIALLY_PAID",
    ) ?? [];

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
          void saveCustomer();
        }}
      >
        <Input
          label={messages.name}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label={messages.phone}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Input
          label={messages.notes}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <Button type="submit" disabled={submitting}>
          {messages.add}
        </Button>
      </form>

      <Input
        label={messages.search}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {customers.length === 0 && !customersQuery.isLoading ? (
        <EmptyState title={messages.emptyTitle} description={messages.emptyBody} />
      ) : (
        <ul className="space-y-2">
          {customers.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-ink-300/70 bg-white px-4 py-3 text-left shadow-soft"
                onClick={() => setSelectedId(customer.id)}
              >
                <span>
                  <span className="block font-semibold text-ink-900">{customer.name}</span>
                  <span className="block text-sm text-ink-500">{customer.phone ?? "—"}</span>
                </span>
                <span className="text-sm font-semibold text-ink-900">
                  {formatMoney(customer.outstandingBalance)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {detail ? (
        <div className="space-y-4 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{detail.name}</h2>
            <p className="text-sm text-ink-500">
              {messages.outstanding} {formatMoney(detail.outstandingBalance)}
            </p>
          </div>

          {openSales.length === 0 ? (
            <p className="text-sm text-ink-500">{messages.noOpenSales}</p>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void saveRepayment();
              }}
            >
              <Select
                label={messages.sale}
                value={saleId}
                onChange={(event) => setSaleId(event.target.value)}
              >
                <option value="">{messages.selectSale}</option>
                {openSales.map((sale) => (
                  <option key={sale.id} value={sale.id}>
                    {sale.receiptNumber} · {formatMoney(sale.outstandingBalance)}
                  </option>
                ))}
              </Select>
              <Input
                label={messages.repaymentAmount}
                inputMode="decimal"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              <Select
                label={messages.method}
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              >
                {(["CASH", "BANK_TRANSFER", "TELEBIRR", "OTHER"] as const).map((item) => (
                  <option key={item} value={item}>
                    {salesMessages.methods[item]}
                  </option>
                ))}
              </Select>
              <Button type="submit" disabled={submitting || !saleId}>
                {messages.repay}
              </Button>
            </form>
          )}

          <div>
            <h3 className="font-semibold text-ink-900">{messages.history}</h3>
            {detail.repayments.length === 0 ? (
              <p className="text-sm text-ink-500">{t().common.empty}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {detail.repayments.map((repayment) => (
                  <li key={repayment.id} className="text-sm text-ink-700">
                    {formatDateTime(repayment.paidAt)} · {formatMoney(repayment.amount)} ·{" "}
                    {salesMessages.methods[repayment.method as keyof typeof salesMessages.methods] ??
                      repayment.method}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
