import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { logout } from "@/features/auth/api";
import { useAuth, useInvalidateAuth } from "@/features/auth/useAuth";
import { t } from "@/i18n";

export function SettingsPage() {
  const messages = t().settings;
  const authMessages = t().auth;
  const { user } = useAuth();
  const invalidateAuth = useInvalidateAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      // Invalidating flips the shared auth query to unauthenticated, which
      // causes the RequireAuth guard to redirect to /login reactively.
      await invalidateAuth();
      setLoggingOut(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />

      {user ? (
        <div className="space-y-4 rounded-2xl border border-ink-300/70 bg-white p-5 shadow-soft">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {authMessages.accountLabel}
            </p>
            <p className="mt-1 text-base font-semibold text-ink-900">
              {user.displayName}
            </p>
            <p className="text-sm text-ink-500">{user.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              {authMessages.shopNameLabel}
            </p>
            <p className="mt-1 text-sm text-ink-900">{user.shop.name}</p>
          </div>
          <Button
            variant="danger"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            {loggingOut ? messages.loggingOut : authMessages.logout}
          </Button>
        </div>
      ) : (
        <EmptyState title={messages.title} description={t().common.loading} />
      )}
    </section>
  );
}
