import type { ReactNode } from "react";

type ReportCardProps = {
  title: string;
  summary?: string;
  note?: string;
  children: ReactNode;
};

export function ReportCard({ title, summary, note, children }: ReportCardProps) {
  return (
    <article className="min-w-0 rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <h2 className="min-w-0 break-words text-lg font-semibold text-ink-900">{title}</h2>
        {summary ? (
          <p className="shrink-0 text-sm font-semibold text-ink-900 sm:text-right">{summary}</p>
        ) : null}
      </div>
      <div className="mt-4">{children}</div>
      {note ? <p className="mt-4 text-xs leading-5 text-ink-500">{note}</p> : null}
    </article>
  );
}
