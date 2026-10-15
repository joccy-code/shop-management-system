import { useState } from "react";

export type DonutSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
  display: string;
};

type DonutChartProps = {
  slices: DonutSlice[];
  centerLabel: string;
  centerValue: string;
  emptyLabel: string;
};

const SIZE = 200;
const CENTER = SIZE / 2;
const OUTER = 86;
const INNER = 60;

function polar(radius: number, angle: number): { x: number; y: number } {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function slicePath(start: number, end: number): string {
  const sweep = end - start;
  if (sweep >= 359.9) {
    return [
      `M ${CENTER - OUTER} ${CENTER}`,
      `a ${OUTER} ${OUTER} 0 1 0 ${OUTER * 2} 0`,
      `a ${OUTER} ${OUTER} 0 1 0 ${-OUTER * 2} 0`,
      `M ${CENTER - INNER} ${CENTER}`,
      `a ${INNER} ${INNER} 0 1 1 ${INNER * 2} 0`,
      `a ${INNER} ${INNER} 0 1 1 ${-INNER * 2} 0`,
    ].join(" ");
  }

  const large = sweep > 180 ? 1 : 0;
  const outerStart = polar(OUTER, start);
  const outerEnd = polar(OUTER, end);
  const innerEnd = polar(INNER, end);
  const innerStart = polar(INNER, start);
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${OUTER} ${OUTER} 0 ${large} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${INNER} ${INNER} 0 ${large} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function shareLabel(value: number, total: number): string {
  if (total <= 0) {
    return "0%";
  }
  const share = (value / total) * 100;
  if (share > 0 && share < 10) {
    return `${share.toFixed(1)}%`;
  }
  return `${Math.round(share)}%`;
}

function splitDisplay(display: string): { caption: string; amount: string } {
  const match = /^([A-Za-z]{3})\s+(.+)$/.exec(display.trim());
  if (!match?.[1] || !match[2]) {
    return { caption: "", amount: display };
  }
  return { caption: match[1], amount: match[2] };
}

export function DonutChart({ slices, centerLabel, centerValue, emptyLabel }: DonutChartProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const drawn = slices.filter((slice) => slice.value > 0 && Number.isFinite(slice.value));
  const total = drawn.reduce((sum, slice) => sum + slice.value, 0);

  if (drawn.length === 0 || total <= 0) {
    return <p className="text-sm text-ink-500">{emptyLabel}</p>;
  }

  const gap = drawn.length > 1 ? 1.6 : 0;
  let cursor = 0;
  const arcs = drawn.map((slice) => {
    const sweep = (slice.value / total) * 360;
    const inset = sweep > gap * 2 ? gap / 2 : 0;
    const start = cursor + inset;
    const end = cursor + sweep - inset;
    cursor += sweep;
    return { slice, path: slicePath(start, end) };
  });

  const active = drawn.find((slice) => slice.id === activeId) ?? null;
  const summary = drawn.map((slice) => `${slice.label} ${slice.display}`).join(", ");
  const center = splitDisplay(active?.display ?? centerValue);
  const caption = active ? shareLabel(active.value, total) : center.caption || centerLabel;

  return (
    <div className="space-y-4">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={summary}
        className="mx-auto h-48 w-48"
      >
        {arcs.map(({ slice, path }) => (
          <path
            key={slice.id}
            d={path}
            fill={slice.color}
            fillRule="evenodd"
            opacity={active && active.id !== slice.id ? 0.4 : 1}
            onMouseEnter={() => setActiveId(slice.id)}
            onMouseLeave={() => setActiveId(null)}
          >
            <title>{`${slice.label}: ${slice.display}`}</title>
          </path>
        ))}
        <text x={CENTER} y={CENTER - 4} textAnchor="middle" fill="#6b7280" fontSize="12">
          {caption}
        </text>
        <text
          x={CENTER}
          y={CENTER + 16}
          textAnchor="middle"
          fill="#111827"
          fontSize={center.amount.length > 11 ? 12 : 15}
          fontWeight="700"
        >
          {center.amount}
        </text>
      </svg>
      <ul className="space-y-1">
        {drawn.map((slice) => (
          <li key={slice.id}>
            <button
              type="button"
              className={`flex min-h-11 w-full min-w-0 items-center gap-2 rounded-xl px-2 py-1.5 text-left ${
                activeId === slice.id ? "bg-ink-100" : "hover:bg-ink-50"
              }`}
              onMouseEnter={() => setActiveId(slice.id)}
              onMouseLeave={() => setActiveId(null)}
              onFocus={() => setActiveId(slice.id)}
              onBlur={() => setActiveId(null)}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-sm text-ink-700">{slice.label}</span>
              <span className="shrink-0 text-sm font-semibold text-ink-900">{slice.display}</span>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-ink-500">
                {shareLabel(slice.value, total)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
