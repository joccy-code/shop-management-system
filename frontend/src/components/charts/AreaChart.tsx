import { useState, type PointerEvent } from "react";

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
};

export type ChartPoint = {
  label: string;
  title: string;
  values: Record<string, number>;
};

type AreaChartProps = {
  series: ChartSeries[];
  points: ChartPoint[];
  emptyLabel: string;
  formatValue: (value: number) => string;
  ariaLabel: string;
};

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 48 };

function niceMax(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const padded = value * 1.08;
  const exponent = Math.floor(Math.log10(padded));
  const fraction = padded / 10 ** exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * 10 ** exponent;
}

function compactNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 10_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  if (abs >= 1_000) {
    const scaled = value / 1_000;
    const text = scaled >= 10 ? String(Math.round(scaled)) : String(Math.round(scaled * 10) / 10);
    return `${text}k`;
  }
  return abs >= 10 ? String(Math.round(value)) : value.toFixed(abs >= 1 ? 0 : 1);
}

function labelIndexes(count: number): number[] {
  if (count <= 1) {
    return [0];
  }
  if (count <= 6) {
    return Array.from({ length: count }, (_, index) => index);
  }
  const indexes = new Set<number>([0, count - 1]);
  for (let step = 1; step < 4; step += 1) {
    indexes.add(Math.round((step * (count - 1)) / 4));
  }
  return [...indexes].sort((left, right) => left - right);
}

export function AreaChart({
  series,
  points,
  emptyLabel,
  formatValue,
  ariaLabel,
}: AreaChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const peak = Math.max(
    0,
    ...points.flatMap((point) => series.map((item) => point.values[item.key] ?? 0)),
  );

  if (points.length === 0 || peak <= 0) {
    return <p className="text-sm text-ink-500">{emptyLabel}</p>;
  }

  const yMax = niceMax(peak);
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const xAt = (index: number) =>
    points.length === 1 ? PAD.left + innerWidth / 2 : PAD.left + (index / (points.length - 1)) * innerWidth;
  const yAt = (value: number) => PAD.top + innerHeight - (value / yMax) * innerHeight;
  const baseline = yAt(0);
  const selectedIndex = hoverIndex ?? points.length - 1;
  const selected = points[selectedIndex];

  const coordsFor = (key: string) =>
    points.map((point, index) => ({
      x: xAt(index),
      y: yAt(point.values[key] ?? 0),
    }));

  const linePath = (key: string) =>
    coordsFor(key)
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(" ");

  const areaPath = (key: string) => {
    const coords = coordsFor(key);
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (!first || !last) {
      return "";
    }
    return `${linePath(key)} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
  };

  function selectFromPointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width === 0) {
      return;
    }
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let best = Number.POSITIVE_INFINITY;
    for (let index = 0; index < points.length; index += 1) {
      const distance = Math.abs(xAt(index) - relativeX);
      if (distance < best) {
        best = distance;
        nearest = index;
      }
    }
    setHoverIndex(nearest);
  }

  const markerX = xAt(selectedIndex);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={ariaLabel}
          className="block h-auto w-full touch-none"
          onPointerMove={selectFromPointer}
          onPointerDown={selectFromPointer}
        >
          {[yMax, yMax / 2, 0].map((tick) => {
            const y = yAt(tick);
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
                <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#6b7280" fontSize="11">
                  {compactNumber(tick)}
                </text>
              </g>
            );
          })}
          {series[0] ? (
            <path d={areaPath(series[0].key)} fill={series[0].color} opacity="0.18" />
          ) : null}
          {series.map((item, index) => (
            <path
              key={item.key}
              d={linePath(item.key)}
              fill="none"
              stroke={item.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              {...(index === 0 ? {} : { strokeDasharray: "6 4" })}
            />
          ))}
          <line
            x1={markerX}
            x2={markerX}
            y1={PAD.top}
            y2={baseline}
            stroke="#d1d5db"
            strokeDasharray="3 3"
          />
          {series.map((item) => (
            <circle
              key={item.key}
              cx={markerX}
              cy={yAt(selected?.values[item.key] ?? 0)}
              r="4.5"
              fill={item.color}
              stroke="#ffffff"
              strokeWidth="2"
            />
          ))}
          {labelIndexes(points.length).map((index) => {
            const point = points[index];
            if (!point) {
              return null;
            }
            return (
              <text
                key={point.title}
                x={xAt(index)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fill="#6b7280"
                fontSize="11"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {series.map((item) => (
          <p key={item.key} className="flex items-center gap-2 text-sm text-ink-700">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.label}
          </p>
        ))}
      </div>
      {selected ? (
        <p className="mt-2 text-sm text-ink-700">
          <span className="font-semibold text-ink-900">{selected.title}</span>
          {series.map((item) => (
            <span key={item.key}>
              {" "}
              · {item.label} {formatValue(selected.values[item.key] ?? 0)}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
