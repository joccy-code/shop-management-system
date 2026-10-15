import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Select } from "@/components/ui/Select";
import { listCustomers } from "@/features/customers/api";
import { listProducts } from "@/features/products/api";
import type { Product } from "@/features/products/types";
import { createSale, listSales, voidSale } from "@/features/sales/api";
import type { PaymentMethod, Sale } from "@/features/sales/types";
import { t } from "@/i18n";
import { ApiError } from "@/lib/api";
import { formatDateTime, formatMoney } from "@/lib/format";
import { addMoney, compareMoney, multiplyMoney } from "@/lib/money";

type CartLine = {
  productId: string;
  name: string;
  unitPrice: string;
  stockQuantity: string;
  quantity: string;
};

const METHODS: PaymentMethod[] = [
  "CASH",
  "BANK_TRANSFER",
  "TELEBIRR",
  "OTHER",
  "CREDIT",
];

function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.code === "NETWORK" ? t().common.connectionRequired : error.message;
  }
  return fallback;
}

export function SalesPage() {
  const messages = t().sales;
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amountPaid, setAmountPaid] = useState("0.00");
  const [amountDirty, setAmountDirty] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [savedSale, setSavedSale] = useState<Sale | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const productsQuery = useQuery({
    queryKey: ["products", "sale-search", search],
    queryFn: () => listProducts(search || undefined, "ACTIVE"),
  });

  const salesQuery = useQuery({
    queryKey: ["sales"],
    queryFn: listSales,
  });

  const customersQuery = useQuery({
    queryKey: ["customers"],
    queryFn: () => listCustomers(),
  });

  const total = useMemo(
    () => addMoney(cart.map((line) => multiplyMoney(line.unitPrice, line.quantity))),
    [cart],
  );

  useEffect(() => {
    if (!amountDirty && method !== "CREDIT") {
      setAmountPaid(total);
    }
    if (method === "CREDIT") {
      setAmountPaid("0.00");
    }
  }, [total, amountDirty, method]);

  const payloadSignature = JSON.stringify({
    cart,
    method,
    amountPaid,
    customerId,
    notes,
  });

  useEffect(() => {
    idempotencyKey.current = null;
  }, [payloadSignature]);

  const outstanding =
    compareMoney(amountPaid || "0", total) < 0;

  const addProduct = (product: Product) => {
    setSavedSale(null);
    setPageError(null);
    setCart((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        const nextQuantity = String(Number(existing.quantity) + 1);
        return current.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: Number(nextQuantity).toFixed(3) }
            : line,
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          unitPrice: product.sellingPrice,
          stockQuantity: product.stockQuantity,
          quantity: "1.000",
        },
      ];
    });
  };

  const confirmSale = async () => {
    setPageError(null);
    if (cart.length === 0) {
      return;
    }
    if (outstanding && !customerId) {
      setPageError(messages.customerRequired);
      return;
    }

    if (!idempotencyKey.current) {
      idempotencyKey.current = crypto.randomUUID();
    }

    setSubmitting(true);
    try {
      const result = await createSale(
        {
          items: cart.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
          paymentMethod: method,
          amountPaid: method === "CREDIT" ? "0" : amountPaid,
          customerId: customerId || null,
          notes: notes || null,
        },
        idempotencyKey.current,
      );
      setSavedSale(result.sale);
      setCart([]);
      setNotes("");
      setCustomerId("");
      setAmountDirty(false);
      setMethod("CASH");
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (error) {
      setPageError(errorText(error, messages.connectionRequired));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoid = async (sale: Sale) => {
    if (!window.confirm(messages.voidConfirm)) {
      return;
    }
    setPageError(null);
    try {
      await voidSale(sale.id, "Voided from sales screen");
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } catch (error) {
      setPageError(errorText(error, t().common.saveError));
    }
  };

  const products = productsQuery.data ?? [];
  const sales = salesQuery.data?.items ?? [];

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />

      {pageError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger-600">
          {pageError}
        </p>
      ) : null}

      {savedSale ? (
        <div
          role="status"
          className="space-y-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4"
        >
          <p className="text-lg font-semibold text-ink-900">{messages.successTitle}</p>
          <p className="text-sm text-ink-700">
            {messages.receipt} {savedSale.receiptNumber} · {formatMoney(savedSale.total)}
          </p>
          <Button variant="secondary" onClick={() => setSavedSale(null)}>
            {messages.newSale}
          </Button>
        </div>
      ) : null}

      <Input
        label={messages.searchPlaceholder}
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder={messages.searchPlaceholder}
      />

      <ul className="space-y-2">
        {products.map((product) => (
          <li
            key={product.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-ink-300/70 bg-white px-4 py-3 shadow-soft"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink-900">{product.name}</p>
              <p className="text-sm text-ink-500">
                {formatMoney(product.sellingPrice)} · {messages.quantity}{" "}
                {product.stockQuantity}
              </p>
            </div>
            <Button className="min-h-11 shrink-0" onClick={() => addProduct(product)}>
              {messages.add}
            </Button>
          </li>
        ))}
      </ul>

      <div className="space-y-4 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ink-900">{messages.cart}</h2>
        {cart.length === 0 ? (
          <p className="text-sm text-ink-500">{messages.emptyCart}</p>
        ) : (
          <ul className="space-y-3">
            {cart.map((line) => (
              <li key={line.productId} className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{line.name}</p>
                  <p className="text-sm text-ink-500">
                    {formatMoney(multiplyMoney(line.unitPrice, line.quantity))}
                  </p>
                </div>
                <Input
                  label={messages.quantity}
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(event) => {
                    const quantity = event.target.value;
                    setCart((current) =>
                      current.map((item) =>
                        item.productId === line.productId ? { ...item, quantity } : item,
                      ),
                    );
                  }}
                />
                <Button
                  variant="ghost"
                  onClick={() =>
                    setCart((current) =>
                      current.filter((item) => item.productId !== line.productId),
                    )
                  }
                >
                  {messages.remove}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xl font-bold text-ink-900">
          {messages.total} {formatMoney(total)}
        </p>

        <Select
          label={messages.paymentMethod}
          value={method}
          onChange={(event) => {
            const next = event.target.value as PaymentMethod;
            setMethod(next);
            if (next === "CREDIT") {
              setAmountPaid("0.00");
              setAmountDirty(true);
            } else {
              setAmountDirty(false);
            }
          }}
        >
          {METHODS.map((item) => (
            <option key={item} value={item}>
              {messages.methods[item]}
            </option>
          ))}
        </Select>

        <Input
          label={messages.amountPaid}
          inputMode="decimal"
          value={amountPaid}
          disabled={method === "CREDIT"}
          onChange={(event) => {
            setAmountDirty(true);
            setAmountPaid(event.target.value);
          }}
        />

        {outstanding ? (
          <Select
            label={messages.customer}
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          >
            <option value="">{messages.selectCustomer}</option>
            {(customersQuery.data?.items ?? []).map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        ) : null}

        <Input
          label={messages.notes}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />

        <Button
          className="w-full"
          disabled={submitting || cart.length === 0}
          onClick={() => void confirmSale()}
        >
          {submitting ? messages.confirming : messages.confirm}
        </Button>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-ink-900">{messages.recent}</h2>
        {salesQuery.isLoading ? (
          <p className="text-sm text-ink-500">{t().common.loading}</p>
        ) : sales.length === 0 ? (
          <EmptyState title={messages.title} description={messages.emptySales} />
        ) : (
          <ul className="space-y-2">
            {sales.map((sale) => (
              <li
                key={sale.id}
                className="rounded-2xl border border-ink-300/70 bg-white px-4 py-3 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">
                      {sale.receiptNumber} · {formatMoney(sale.total)}
                    </p>
                    <p className="text-sm text-ink-500">
                      {formatDateTime(sale.soldAt)} · {messages.statuses[sale.status]}
                      {sale.customerName ? ` · ${sale.customerName}` : ""}
                    </p>
                  </div>
                  {sale.status !== "VOIDED" ? (
                    <Button variant="ghost" onClick={() => void handleVoid(sale)}>
                      {messages.voidSale}
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
