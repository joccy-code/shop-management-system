import type { ReactNode } from "react";

type ReportCardProps = {
  title: string;
  summary?: string;
  note?: string;
  children: ReactNode;
};

export function ReportCard({ title, summary, note, children }: ReportCardProps) {
  return (
    <article className="rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        {summary ? <p className="text-right text-sm font-semibold text-ink-900">{summary}</p> : null}
      </div>
      <div className="mt-4">{children}</div>
      {note ? <p className="mt-4 text-xs leading-5 text-ink-500">{note}</p> : null}
    </article>
  );
}
