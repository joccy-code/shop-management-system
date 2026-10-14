import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { t } from "@/i18n";

export function HomePage() {
  const messages = t().home;

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />
      <EmptyState title={messages.title} description={messages.emptyHint} />
    </section>
  );
}
