import { useState } from "react";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { changePassword, logout } from "@/features/auth/api";
import { useAuth, useInvalidateAuth } from "@/features/auth/useAuth";
import { t, useMessages } from "@/i18n";
import { ApiError } from "@/lib/api";

export function SettingsPage() {
  useMessages();
  const messages = t().settings;
  const language = t().language;
  const authMessages = t().auth;
  const { user } = useAuth();
  const invalidateAuth = useInvalidateAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

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

  const handlePassword = async () => {
    setPasswordError(null);
    setPasswordMessage(null);
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMessage(messages.passwordUpdated);
    } catch (error) {
      setPasswordError(
        error instanceof ApiError ? error.message : t().common.saveError,
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <section className="space-y-5">
      <PageHeader title={messages.headline} description={messages.body} />

      <div className="rounded-2xl border border-ink-300/70 bg-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          {language.label}
        </p>
        <p className="mt-1 text-sm text-ink-500">{language.help}</p>
        <div className="mt-3">
          <LanguageSwitch />
        </div>
      </div>

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
          <form
            className="space-y-3 border-t border-ink-100 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void handlePassword();
            }}
          >
            <Input
              label={messages.currentPassword}
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
            <Input
              label={messages.newPassword}
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            {passwordError ? (
              <p role="alert" className="text-sm text-danger-600">
                {passwordError}
              </p>
            ) : null}
            {passwordMessage ? (
              <p role="status" className="text-sm text-brand-800">
                {passwordMessage}
              </p>
            ) : null}
            <Button type="submit" variant="secondary" disabled={savingPassword}>
              {messages.changePassword}
            </Button>
          </form>
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
