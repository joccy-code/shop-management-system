export const CHART_COLORS = [
  "#16a34a",
  "#0284c7",
  "#d97706",
  "#7c3aed",
  "#e11d48",
  "#0d9488",
  "#4f46e5",
  "#ca8a04",
  "#db2777",
  "#475569",
] as const;

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0];
}
