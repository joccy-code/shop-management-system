type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">{title}</h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-ink-500">{description}</p>
      ) : null}
    </header>
  );
}
