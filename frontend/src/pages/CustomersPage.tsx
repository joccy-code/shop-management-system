import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
  removeCustomer,
  type CustomerPage,
} from "@/features/customers/api";
import { t, useMessages } from "@/i18n";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";

export function CustomersPage() {
  useMessages();
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
  const [createdId, setCreatedId] = useState<string | null>(null);

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
      setCreatedId(created.id);
      queryClient.setQueryData<CustomerPage>(["customers", search], (current) => {
        const items = [...(current?.items ?? []).filter((item) => item.id !== created.id), created].sort(
          (left, right) => left.name.localeCompare(right.name),
        );
        const alreadyListed = current?.items.some((item) => item.id === created.id) ?? false;
        return {
          items,
          page: current?.page ?? 1,
          pageSize: current?.pageSize ?? 50,
          total: (current?.total ?? 0) + (alreadyListed ? 0 : 1),
        };
      });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    } catch (error) {
      setPageError(error instanceof ApiError ? error.message : t().common.saveError);
    } finally {
      setSubmitting(false);
    }
  };

  const removeSelectedCustomer = async (customerId: string, outstanding: string) => {
    if (Number(outstanding) > 0) {
      setPageError(messages.stillOwes);
      return;
    }
    if (typeof window !== "undefined" && !window.confirm(messages.removeConfirm)) {
      return;
    }
    setPageError(null);
    setSubmitting(true);
    try {
      await removeCustomer(customerId);
      if (selectedId === customerId) {
        setSelectedId(null);
      }
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
    } catch (error) {
      setPageError(
        error instanceof ApiError && error.code === "CUSTOMER_HAS_BALANCE"
          ? messages.stillOwes
          : error instanceof ApiError
            ? error.message
            : t().common.saveError,
      );
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
  const listError =
    customersQuery.isError && customers.length === 0
      ? customersQuery.error instanceof ApiError
        ? customersQuery.error.message
        : messages.loadError
      : null;

  useEffect(() => {
    if (!createdId) {
      return;
    }
    document.getElementById(`customer-${createdId}`)?.scrollIntoView?.({ block: "center" });
  }, [createdId, customers]);
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
      {listError ? (
        <p role="alert" className="text-sm text-danger-600">
          {listError}
        </p>
      ) : null}

      <Input
        label={messages.search}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {customers.length === 0 && !customersQuery.isLoading && !listError ? (
        <EmptyState title={messages.emptyTitle} description={messages.emptyBody} />
      ) : customers.length > 0 ? (
        <ul className="space-y-2">
          {customers.map((customer) => (
            <li
              id={`customer-${customer.id}`}
              key={customer.id}
              className="flex items-stretch gap-2 rounded-2xl border border-ink-300/70 bg-white shadow-soft"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setSelectedId(customer.id)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink-900">{customer.name}</span>
                  <span className="block truncate text-sm text-ink-500">{customer.phone ?? "—"}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink-900">
                  {formatMoney(customer.outstandingBalance)}
                </span>
              </button>
              <Button
                variant="ghost"
                className="min-h-10 shrink-0 self-center px-3 text-sm text-danger-600"
                disabled={submitting}
                onClick={() =>
                  void removeSelectedCustomer(customer.id, customer.outstandingBalance)
                }
              >
                {messages.remove}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {detail ? (
        <div className="space-y-4 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">{detail.name}</h2>
              <p className="text-sm text-ink-500">
                {messages.outstanding} {formatMoney(detail.outstandingBalance)}
              </p>
            </div>
            <Button
              variant="ghost"
              className="min-h-10 px-3 text-sm text-danger-600"
              disabled={submitting}
              onClick={() =>
                void removeSelectedCustomer(detail.id, detail.outstandingBalance)
              }
            >
              {messages.remove}
            </Button>
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
    </section>
  );
}
