import { Menu, Settings, Users, Wallet, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { t, useMessages } from "@/i18n";

const items = [
  { to: "/expenses", labelKey: "expenses", icon: Wallet },
  { to: "/customers", labelKey: "customers", icon: Users },
  { to: "/settings", labelKey: "settings", icon: Settings },
] as const;

export function MoreMenu() {
  useMessages();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const titleId = useId();
  const messages = t();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      <Button
        variant="secondary"
        className="min-h-11 min-w-11 px-2.5"
        aria-label={messages.nav.menu}
        aria-expanded={open}
        aria-controls="more-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-ink-900/40"
            aria-label={messages.nav.closeMenu}
            onClick={() => setOpen(false)}
          />
          <div
            id="more-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 id={titleId} className="text-lg font-semibold text-ink-900">
                {messages.nav.more}
              </h2>
              <Button
                variant="ghost"
                className="min-h-11 px-3"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                {messages.nav.closeMenu}
              </Button>
            </div>
            <ul className="space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      className="flex min-h-14 items-center gap-3 rounded-xl border border-ink-300 px-4 text-base font-semibold text-ink-900"
                    >
                      <Icon className="h-5 w-5 text-brand-700" aria-hidden="true" />
                      {messages.nav[item.labelKey]}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
