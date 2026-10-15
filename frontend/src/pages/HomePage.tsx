import { useQuery } from "@tanstack/react-query";
import { Package, ShoppingCart, Users, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { AreaChart } from "@/components/charts/AreaChart";
import { chartColor } from "@/components/charts/palette";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchDashboard, type DashboardReport } from "@/features/reports/api";
import { t, useMessages } from "@/i18n";
import { formatDateTime, formatMoney, todayInputValue } from "@/lib/format";

const actions = [
  { to: "/sales", labelKey: "recordSale", icon: ShoppingCart, primary: true },
  { to: "/expenses", labelKey: "recordExpense", icon: Wallet, primary: false },
  { to: "/products", labelKey: "checkStock", icon: Package, primary: false },
  { to: "/customers", labelKey: "customerCredit", icon: Users, primary: false },
] as const;

function AttentionCard({
  to,
  label,
  value,
  alert,
}: {
  to: string;
  label: string;
  value: string;
  alert: boolean;
}) {
  return (
    <Link
      to={to}
      className="min-w-0 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft transition hover:border-brand-600"
    >
      <p className="text-sm font-semibold leading-snug text-ink-500">{label}</p>
      <p className={`mt-1 break-words text-lg font-bold sm:text-xl ${alert ? "text-warning-600" : "text-ink-900"}`}>
        {value}
      </p>
    </Link>
  );
}

function saleStatusLabel(status: string): string {
  const statuses = t().sales.statuses;
  if (status in statuses) {
    return statuses[status as keyof typeof statuses];
  }
  return status;
}

export function HomePage() {
  useMessages();
  const messages = t().home;
  const today = todayInputValue();
  const monthStart = `${today.slice(0, 7)}-01`;
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", monthStart, today],
    queryFn: () => fetchDashboard(monthStart, today),
  });

  const data = dashboardQuery.data;
  const trend = data?.salesTrend.slice(-14) ?? [];

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className={`flex min-h-16 min-w-0 items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold shadow-soft ${
                action.primary
                  ? "bg-brand-700 text-white"
                  : "border border-ink-300/70 bg-white text-ink-900"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span className="min-w-0">{messages[action.labelKey]}</span>
            </Link>
          );
        })}
      </div>

      {dashboardQuery.isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-36 animate-pulse rounded-3xl bg-white" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
            <div className="h-20 animate-pulse rounded-2xl bg-white" />
          </div>
          <p className="text-sm text-ink-500">{t().common.loading}</p>
        </div>
      ) : dashboardQuery.isError || !data ? (
        <EmptyState title={messages.title} description={t().common.saveError} />
      ) : (
        <Dashboard data={data} trend={trend} />
      )}
    </section>
  );
}

function Dashboard({
  data,
  trend,
}: {
  data: DashboardReport;
  trend: DashboardReport["salesTrend"];
}) {
  const messages = t().home;
  const outstanding = Number(data.outstandingCredit);
  const lowStock = data.lowStockCount;

  return (
    <>
      <div className="rounded-3xl bg-brand-700 px-5 py-5 text-white shadow-soft">
        <p className="text-sm font-semibold text-brand-100">{messages.salesToday}</p>
        <p className="mt-1 break-words text-3xl font-bold tracking-tight">{formatMoney(data.salesToday)}</p>
        <dl className="mt-4 grid grid-cols-1 gap-2 border-t border-white/20 pt-4 text-sm sm:grid-cols-3 sm:gap-3">
          <div className="flex min-w-0 items-baseline justify-between gap-3 sm:block">
            <dt className="text-brand-100">{messages.heroMonth}</dt>
            <dd className="font-semibold sm:mt-1">{formatMoney(data.salesThisMonth)}</dd>
          </div>
          <div className="flex min-w-0 items-baseline justify-between gap-3 sm:block">
            <dt className="text-brand-100">{messages.heroCollected}</dt>
            <dd className="font-semibold sm:mt-1">{formatMoney(data.collectedInPeriod)}</dd>
          </div>
          <div className="flex min-w-0 items-baseline justify-between gap-3 sm:block">
            <dt className="text-brand-100">{messages.heroExpenses}</dt>
            <dd className="font-semibold sm:mt-1">{formatMoney(data.expensesToday)}</dd>
          </div>
        </dl>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <AttentionCard
          to="/customers"
          label={messages.outstanding}
          value={formatMoney(data.outstandingCredit)}
          alert={outstanding > 0}
        />
        <AttentionCard
          to="/products"
          label={messages.lowStock}
          value={String(lowStock)}
          alert={lowStock > 0}
        />
      </div>

      <div className="rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
        <p className="text-sm font-semibold text-ink-500">{messages.profit}</p>
        <p className="mt-1 text-2xl font-bold text-ink-900">
          {formatMoney(data.estimatedNetProfit)}
        </p>
        <p className="mt-2 text-sm leading-6 text-ink-500">{messages.profitHint}</p>
      </div>

      <div className="rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="min-w-0 font-semibold text-ink-900">{messages.lastDays}</h2>
          <Link className="text-sm font-semibold text-brand-700" to="/reports">
            {messages.seeAll}
          </Link>
        </div>
        <AreaChart
          ariaLabel={messages.lastDays}
          emptyLabel={messages.chartEmpty}
          formatValue={formatMoney}
          series={[{ key: "total", label: messages.salesToday, color: chartColor(0) }]}
          points={trend.map((point) => ({
            label: point.date.slice(5),
            title: point.date,
            values: { total: Number(point.total) },
          }))}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-900">{messages.recent}</h2>
          <Link className="text-sm font-semibold text-brand-700" to="/sales">
            {messages.seeAll}
          </Link>
        </div>
        {data.recentSales.length === 0 ? (
          <EmptyState title={messages.title} description={messages.emptyHint} />
        ) : (
          <ul className="space-y-2">
            {data.recentSales.map((sale) => (
              <li
                key={sale.id}
                className="rounded-2xl border border-ink-300/70 bg-white px-4 py-3 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">
                      {sale.receiptNumber}
                      {sale.customerName ? ` · ${sale.customerName}` : ""}
                    </p>
                    <p className="mt-1 text-sm text-ink-500">{formatDateTime(sale.soldAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-ink-900">{formatMoney(sale.total)}</p>
                    <p
                      className={`mt-1 text-xs font-semibold ${
                        sale.status === "VOIDED"
                          ? "text-ink-500"
                          : sale.status === "COMPLETED"
                            ? "text-brand-700"
                            : "text-warning-600"
                      }`}
                    >
                      {saleStatusLabel(sale.status)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
