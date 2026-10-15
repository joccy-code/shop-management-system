import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Input } from "@/components/ui/Input";
import {
  fetchCustomerBalances,
  fetchExpensesReport,
  fetchInventoryReport,
  fetchSalesReport,
} from "@/features/reports/api";
import { t } from "@/i18n";
import { formatMoney, todayInputValue } from "@/lib/format";

export function ReportsPage() {
  const messages = t().reports;
  const expenseMessages = t().expenses;
  const today = todayInputValue();
  const [from, setFrom] = useState(`${today.slice(0, 7)}-01`);
  const [to, setTo] = useState(today);

  const salesQuery = useQuery({
    queryKey: ["reports", "sales", from, to],
    queryFn: () => fetchSalesReport(from, to),
  });
  const expensesQuery = useQuery({
    queryKey: ["reports", "expenses", from, to],
    queryFn: () => fetchExpensesReport(from, to),
  });
  const inventoryQuery = useQuery({
    queryKey: ["reports", "inventory"],
    queryFn: fetchInventoryReport,
  });
  const balancesQuery = useQuery({
    queryKey: ["reports", "balances"],
    queryFn: fetchCustomerBalances,
  });

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={messages.from}
          type="date"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
        />
        <Input
          label={messages.to}
          type="date"
          value={to}
          onChange={(event) => setTo(event.target.value)}
        />
      </div>

      <article className="space-y-3 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ink-900">{messages.sales}</h2>
        {salesQuery.data ? (
          <>
            <p className="text-sm text-ink-700">
              {messages.revenue}: {formatMoney(salesQuery.data.revenue)}
            </p>
            <p className="text-sm text-ink-700">
              {messages.collected}: {formatMoney(salesQuery.data.collected)}
            </p>
            <p className="text-sm text-ink-700">
              {messages.grossProfit}: {formatMoney(salesQuery.data.estimatedGrossProfit)}
            </p>
            <p className="text-sm leading-6 text-ink-500">{salesQuery.data.profitNote}</p>
            <h3 className="font-semibold text-ink-900">{messages.bestSellers}</h3>
            {salesQuery.data.bestSellers.length === 0 ? (
              <p className="text-sm text-ink-500">{messages.noSales}</p>
            ) : (
              <ul className="space-y-1 text-sm text-ink-700">
                {salesQuery.data.bestSellers.map((item) => (
                  <li key={item.productId}>
                    {item.name} · {item.quantity} · {formatMoney(item.revenue)}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-500">{t().common.loading}</p>
        )}
      </article>

      <article className="space-y-3 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ink-900">{messages.expenses}</h2>
        {expensesQuery.data ? (
          <>
            <p className="text-sm text-ink-700">
              {messages.expenseTotal}: {formatMoney(expensesQuery.data.total)}
            </p>
            {expensesQuery.data.byCategory.length === 0 ? (
              <p className="text-sm text-ink-500">{messages.noExpenses}</p>
            ) : (
              <ul className="space-y-1 text-sm text-ink-700">
                {expensesQuery.data.byCategory.map((item) => (
                  <li key={item.category}>
                    {expenseMessages.categories[
                      item.category as keyof typeof expenseMessages.categories
                    ] ?? item.category}
                    : {formatMoney(item.amount)}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-500">{t().common.loading}</p>
        )}
      </article>

      <article className="space-y-3 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ink-900">{messages.inventory}</h2>
        {inventoryQuery.data ? (
          <>
            <p className="text-sm text-ink-700">
              {messages.costValue}: {formatMoney(inventoryQuery.data.stockCostValue)}
            </p>
            <p className="text-sm text-ink-700">
              {messages.retailValue}: {formatMoney(inventoryQuery.data.potentialSellingValue)}
            </p>
            <p className="text-sm leading-6 text-ink-500">
              {inventoryQuery.data.inventoryNote}
            </p>
            <h3 className="font-semibold text-ink-900">{messages.lowStock}</h3>
            {inventoryQuery.data.lowStock.length === 0 ? (
              <p className="text-sm text-ink-500">{messages.noLowStock}</p>
            ) : (
              <ul className="space-y-1 text-sm text-ink-700">
                {inventoryQuery.data.lowStock.map((item) => (
                  <li key={item.id}>
                    {item.name} · {item.stockQuantity}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-500">{t().common.loading}</p>
        )}
      </article>

      <article className="space-y-3 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
        <h2 className="text-lg font-semibold text-ink-900">{messages.balances}</h2>
        {balancesQuery.data ? (
          <>
            <p className="text-sm text-ink-700">
              {t().customers.outstanding}: {formatMoney(balancesQuery.data.totalOutstanding)}
            </p>
            <p className="text-sm leading-6 text-ink-500">{balancesQuery.data.note}</p>
            {balancesQuery.data.customers.length === 0 ? (
              <p className="text-sm text-ink-500">{messages.noBalances}</p>
            ) : (
              <ul className="space-y-1 text-sm text-ink-700">
                {balancesQuery.data.customers.map((customer) => (
                  <li key={customer.id}>
                    {customer.name} · {formatMoney(customer.outstanding)} ·{" "}
                    {customer.openSaleCount} {messages.openSales}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-ink-500">{t().common.loading}</p>
        )}
      </article>
    </section>
  );
}
