import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchDashboard } from "@/features/reports/api";
import { t } from "@/i18n";
import { formatDateTime, formatMoney, todayInputValue } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

export function HomePage() {
  const messages = t().home;
  const today = todayInputValue();
  const monthStart = `${today.slice(0, 7)}-01`;
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", monthStart, today],
    queryFn: () => fetchDashboard(monthStart, today),
  });

  const data = dashboardQuery.data;
  const trend = data?.salesTrend.slice(-14) ?? [];
  const maxTrend = Math.max(1, ...trend.map((point) => Number(point.total)));

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />

      {dashboardQuery.isLoading ? (
        <p className="text-sm text-ink-500">{t().common.loading}</p>
      ) : dashboardQuery.isError || !data ? (
        <EmptyState title={messages.title} description={t().common.saveError} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={messages.salesToday} value={formatMoney(data.salesToday)} />
            <Stat label={messages.salesMonth} value={formatMoney(data.salesThisMonth)} />
            <Stat label={messages.expensesToday} value={formatMoney(data.expensesToday)} />
            <Stat
              label={messages.estimatedProfit}
              value={formatMoney(data.estimatedNetProfit)}
            />
            <Stat label={messages.collected} value={formatMoney(data.collectedInPeriod)} />
            <Stat label={messages.outstanding} value={formatMoney(data.outstandingCredit)} />
            <Stat label={messages.products} value={String(data.productCount)} />
            <Stat label={messages.lowStock} value={String(data.lowStockCount)} />
          </div>

          <p className="text-sm leading-6 text-ink-500">{data.profitNote}</p>

          <div className="rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
            <h2 className="font-semibold text-ink-900">{messages.trend}</h2>
            {trend.every((point) => Number(point.total) === 0) ? (
              <p className="mt-3 text-sm text-ink-500">{messages.emptyHint}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {trend.map((point) => (
                  <li key={point.date} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2">
                    <span className="text-xs text-ink-500">{point.date.slice(5)}</span>
                    <span className="h-3 overflow-hidden rounded-full bg-ink-100">
                      <span
                        className="block h-full rounded-full bg-brand-600"
                        style={{
                          width:
                            Number(point.total) === 0
                              ? "0%"
                              : `${Math.max(8, (Number(point.total) / maxTrend) * 100)}%`,
                        }}
                      />
                    </span>
                    <span className="text-xs font-semibold text-ink-700">
                      {formatMoney(point.total)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink-900">{messages.recent}</h2>
              <Link className="text-sm font-semibold text-brand-700" to="/sales">
                {t().nav.sales}
              </Link>
            </div>
            {data.recentSales.length === 0 ? (
              <EmptyState title={messages.title} description={messages.emptyHint} />
            ) : (
              <ul className="space-y-2">
                {data.recentSales.map((sale) => (
                  <li
                    key={sale.id}
                    className="rounded-2xl border border-ink-300/70 bg-white px-4 py-3 text-sm shadow-soft"
                  >
                    <span className="font-semibold text-ink-900">
                      {sale.receiptNumber} · {formatMoney(sale.total)}
                    </span>
                    <span className="mt-1 block text-ink-500">
                      {formatDateTime(sale.soldAt)}
                      {sale.customerName ? ` · ${sale.customerName}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  );
}
