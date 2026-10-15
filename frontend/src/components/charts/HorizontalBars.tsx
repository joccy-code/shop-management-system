export type BarItem = {
  id: string;
  label: string;
  value: number;
  display: string;
  color: string;
  detail?: string;
};

type HorizontalBarsProps = {
  items: BarItem[];
  emptyLabel: string;
  ariaLabel: string;
};

export function HorizontalBars({ items, emptyLabel, ariaLabel }: HorizontalBarsProps) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-500">{emptyLabel}</p>;
  }

  const max = Math.max(...items.map((item) => item.value), 0);

  return (
    <ul className="space-y-3" aria-label={ariaLabel}>
      {items.map((item) => {
        const width = max <= 0 || item.value <= 0 ? 0 : Math.max((item.value / max) * 100, 3);
        return (
          <li key={item.id}>
            <div className="mb-1 flex min-w-0 items-baseline justify-between gap-3">
              <p className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink-900">{item.label}</span>
                {item.detail ? (
                  <span className="block truncate text-xs text-ink-500">{item.detail}</span>
                ) : null}
              </p>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-900">
                {item.display}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${width}%`, backgroundColor: item.color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
