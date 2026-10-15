import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AreaChart } from "@/components/charts/AreaChart";
import { DonutChart, type DonutSlice } from "@/components/charts/DonutChart";
import { HorizontalBars, type BarItem } from "@/components/charts/HorizontalBars";
import { chartColor } from "@/components/charts/palette";
import { ReportCard } from "@/components/charts/ReportCard";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  fetchCustomerBalances,
  fetchExpensesReport,
  fetchInventoryReport,
  fetchSalesReport,
  type CustomerBalanceReport,
  type ExpensesReport,
  type InventoryReport,
  type SalesReport,
} from "@/features/reports/api";
import { t, useMessages } from "@/i18n";
import { formatMoney, formatQuantity, todayInputValue } from "@/lib/format";

const COLLECTED_COLOR = "#16a34a";
const OUTSTANDING_COLOR = "#d97706";
const REVENUE_COLOR = "#16a34a";
const COLLECTED_LINE_COLOR = "#0284c7";
const COST_COLOR = "#166534";
const RETAIL_COLOR = "#22c55e";
const LOW_STOCK_COLOR = "#d97706";
const CHART_LIMIT = 8;

function amount(value: string): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-ink-300/70 bg-white px-4 py-3 shadow-soft">
      <p className="break-words text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 break-words text-base font-bold text-ink-900 sm:text-lg">{value}</p>
    </div>
  );
}

function categoryLabel(category: string): string {
  const categories = t().expenses.categories;
  if (category in categories) {
    return categories[category as keyof typeof categories];
  }
  return category;
}

function SalesCharts({ sales }: { sales: SalesReport }) {
  const messages = t().reports;
  const cashSlices: DonutSlice[] = [
    {
      id: "collected",
      label: messages.collected,
      value: amount(sales.collected),
      color: COLLECTED_COLOR,
      display: formatMoney(sales.collected),
    },
    {
      id: "outstanding",
      label: messages.outstanding,
      value: amount(sales.outstanding),
      color: OUTSTANDING_COLOR,
      display: formatMoney(sales.outstanding),
    },
  ];
  const bestSellers: BarItem[] = [...sales.bestSellers]
    .sort((left, right) => amount(right.revenue) - amount(left.revenue))
    .map((item, index) => ({
      id: item.productId,
      label: item.name,
      value: amount(item.revenue),
      display: formatMoney(item.revenue),
      color: chartColor(index),
      detail: `${messages.quantity}: ${formatQuantity(item.quantity)}`,
    }));

  return (
    <>
      <div className="md:col-span-2">
        <ReportCard title={messages.sales} summary={formatMoney(sales.revenue)} note={messages.profitNote}>
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h3 className="mb-3 text-sm font-semibold text-ink-900">{messages.salesTrend}</h3>
              <AreaChart
                key={`${sales.period.from}:${sales.period.to}`}
                ariaLabel={`${messages.salesTrend}, ${messages.revenue} ${formatMoney(sales.revenue)}`}
                emptyLabel={messages.noSales}
                formatValue={formatMoney}
                series={[
                  { key: "revenue", label: messages.revenue, color: REVENUE_COLOR },
                  { key: "collected", label: messages.collected, color: COLLECTED_LINE_COLOR },
                ]}
                points={sales.byDay.map((day) => ({
                  label: day.date.slice(5),
                  title: day.date,
                  values: {
                    revenue: amount(day.revenue),
                    collected: amount(day.collected),
                  },
                }))}
              />
            </div>
            <div className="lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold text-ink-900">{messages.cashMix}</h3>
              <DonutChart
                slices={cashSlices}
                centerLabel={messages.revenue}
                centerValue={formatMoney(sales.revenue)}
                emptyLabel={messages.noSales}
              />
            </div>
          </div>
        </ReportCard>
      </div>
      <ReportCard title={messages.bestSellers}>
        <HorizontalBars
          items={bestSellers}
          emptyLabel={messages.noSales}
          ariaLabel={messages.bestSellers}
        />
      </ReportCard>
    </>
  );
}

function ExpenseChart({ expenses }: { expenses: ExpensesReport }) {
  const messages = t().reports;
  const slices: DonutSlice[] = [...expenses.byCategory]
    .map((item) => ({
      id: item.category,
      label: categoryLabel(item.category),
      value: amount(item.amount),
      display: formatMoney(item.amount),
    }))
    .filter((slice) => slice.value > 0)
    .sort((left, right) => right.value - left.value)
    .map((slice, index) => ({ ...slice, color: chartColor(index) }));

  return (
    <ReportCard title={messages.expenses} summary={formatMoney(expenses.total)}>
      <DonutChart
        slices={slices}
        centerLabel={messages.expenseTotal}
        centerValue={formatMoney(expenses.total)}
        emptyLabel={messages.noExpenses}
      />
    </ReportCard>
  );
}

function InventoryCharts({ inventory }: { inventory: InventoryReport }) {
  const messages = t().reports;
  const valueBars: BarItem[] = [
    {
      id: "cost",
      label: messages.costValue,
      value: amount(inventory.stockCostValue),
      display: formatMoney(inventory.stockCostValue),
      color: COST_COLOR,
    },
    {
      id: "retail",
      label: messages.retailValue,
      value: amount(inventory.potentialSellingValue),
      display: formatMoney(inventory.potentialSellingValue),
      color: RETAIL_COLOR,
    },
  ].filter((item) => item.value > 0);

  const categoryTotals = new Map<string, number>();
  for (const item of inventory.items) {
    const label = item.categoryName?.trim() || messages.uncategorized;
    categoryTotals.set(label, (categoryTotals.get(label) ?? 0) + amount(item.retailValue));
  }
  const categorySlices: DonutSlice[] = [...categoryTotals.entries()]
    .map(([label, value]) => ({
      id: label,
      label,
      value,
      display: formatMoney(value),
      color: RETAIL_COLOR,
    }))
    .filter((slice) => slice.value > 0)
    .sort((left, right) => right.value - left.value)
    .map((slice, index) => ({ ...slice, color: chartColor(index) }));

  const lowStock: BarItem[] = [...inventory.lowStock]
    .sort((left, right) => amount(left.stockQuantity) - amount(right.stockQuantity))
    .slice(0, CHART_LIMIT)
    .map((item) => ({
      id: item.id,
      label: item.name,
      value: amount(item.stockQuantity),
      display: formatQuantity(item.stockQuantity),
      color: LOW_STOCK_COLOR,
    }));
  const hiddenLowStock = Math.max(inventory.lowStock.length - lowStock.length, 0);

  return (
    <div className="md:col-span-2">
      <ReportCard title={messages.inventory} note={messages.inventoryNote}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            {valueBars.length === 0 ? (
              <p className="text-sm text-ink-500">{messages.noInventoryValue}</p>
            ) : (
              <HorizontalBars
                items={valueBars}
                emptyLabel={messages.noInventoryValue}
                ariaLabel={messages.inventory}
              />
            )}
            {categorySlices.length > 1 ? (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-ink-900">{messages.stockByCategory}</h3>
                <DonutChart
                  slices={categorySlices}
                  centerLabel={messages.retailValue}
                  centerValue={formatMoney(inventory.potentialSellingValue)}
                  emptyLabel={messages.noInventoryValue}
                />
              </div>
            ) : null}
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-900">{messages.lowStock}</h3>
            <HorizontalBars
              items={lowStock}
              emptyLabel={messages.noLowStock}
              ariaLabel={messages.lowStock}
            />
            {hiddenLowStock > 0 ? (
              <p className="mt-3 text-xs text-ink-500">
                +{hiddenLowStock} {messages.moreLowStock}
              </p>
            ) : null}
          </div>
        </div>
      </ReportCard>
    </div>
  );
}

function BalanceChart({ balances }: { balances: CustomerBalanceReport }) {
  const messages = t().reports;
  const shown = balances.customers.slice(0, CHART_LIMIT);
  const bars: BarItem[] = shown.map((customer, index) => ({
    id: customer.id,
    label: customer.name,
    value: amount(customer.outstanding),
    display: formatMoney(customer.outstanding),
    color: chartColor(index),
    detail: `${customer.openSaleCount} ${messages.openSales}`,
  }));
  const hidden = balances.customers.length - shown.length;

  return (
    <div className="md:col-span-2">
      <ReportCard
        title={messages.balances}
        summary={formatMoney(balances.totalOutstanding)}
        note={messages.balanceNote}
      >
        <HorizontalBars
          items={bars}
          emptyLabel={messages.noBalances}
          ariaLabel={messages.balances}
        />
        {hidden > 0 ? (
          <p className="mt-3 text-xs text-ink-500">
            +{hidden} {messages.moreBalances}
          </p>
        ) : null}
      </ReportCard>
    </div>
  );
}

function ReportFallback({
  isError,
  isLoading,
}: {
  isError: boolean;
  isLoading: boolean;
}) {
  if (isError) {
    return <p className="text-sm text-ink-500">{t().reports.loadError}</p>;
  }
  if (isLoading) {
    return <p className="text-sm text-ink-500">{t().common.loading}</p>;
  }
  return <p className="text-sm text-ink-500">{t().reports.loadError}</p>;
}

export function ReportsPage() {
  useMessages();
  const messages = t().reports;
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
  const sales = salesQuery.data;

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

      {sales ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label={messages.revenue} value={formatMoney(sales.revenue)} />
          <Stat label={messages.collected} value={formatMoney(sales.collected)} />
          <Stat label={messages.grossProfit} value={formatMoney(sales.estimatedGrossProfit)} />
          <Stat
            label={messages.expenseTotal}
            value={
              expensesQuery.data ? formatMoney(expensesQuery.data.total) : t().common.loading
            }
          />
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {sales ? (
          <SalesCharts sales={sales} />
        ) : (
          <div className="md:col-span-2">
            <ReportCard title={messages.sales}>
              <ReportFallback isError={salesQuery.isError} isLoading={salesQuery.isLoading} />
            </ReportCard>
          </div>
        )}

        {expensesQuery.data ? (
          <ExpenseChart expenses={expensesQuery.data} />
        ) : (
          <ReportCard title={messages.expenses}>
            <ReportFallback isError={expensesQuery.isError} isLoading={expensesQuery.isLoading} />
          </ReportCard>
        )}

        {inventoryQuery.data ? (
          <InventoryCharts inventory={inventoryQuery.data} />
        ) : (
          <div className="md:col-span-2">
            <ReportCard title={messages.inventory}>
              <ReportFallback
                isError={inventoryQuery.isError}
                isLoading={inventoryQuery.isLoading}
              />
            </ReportCard>
          </div>
        )}

        {balancesQuery.data ? (
          <BalanceChart balances={balancesQuery.data} />
        ) : (
          <div className="md:col-span-2">
            <ReportCard title={messages.balances}>
              <ReportFallback isError={balancesQuery.isError} isLoading={balancesQuery.isLoading} />
            </ReportCard>
          </div>
        )}
      </div>
    </section>
  );
}
