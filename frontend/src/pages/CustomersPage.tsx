import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { t } from "@/i18n";

export function CustomersPage() {
  const messages = t().customers;

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />
      <EmptyState
        title={messages.title}
        description={t().common.comingSoon}
      />
    </section>
  );
}
