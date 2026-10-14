type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-300 bg-white/80 px-5 py-8 text-center shadow-soft">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p>
    </div>
  );
}
