import {
  Home,
  Package,
  ReceiptText,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Users,
  Wallet,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { getAppName, t, useMessages } from "@/i18n";

const primaryItems = [
  { to: "/", labelKey: "home", icon: Home, end: true },
  { to: "/sales", labelKey: "sales", icon: ShoppingCart, end: false },
  { to: "/products", labelKey: "products", icon: Package, end: false },
  { to: "/reports", labelKey: "reports", icon: ReceiptText, end: false },
] as const;

const secondaryItems = [
  { to: "/expenses", labelKey: "expenses", icon: Wallet },
  { to: "/customers", labelKey: "customers", icon: Users },
  { to: "/settings", labelKey: "settings", icon: Settings },
] as const;

function linkClass({ isActive }: { isActive: boolean }) {
  return `flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
    isActive
      ? "bg-brand-100 text-brand-800"
      : "text-ink-700 hover:bg-ink-100"
  }`;
}

export function Sidebar() {
  useMessages();
  const messages = t();
  const appName = getAppName();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-ink-300/70 bg-white/90 md:flex md:flex-col">
      <div className="flex items-center gap-3 border-b border-ink-300/70 px-5 py-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-700 text-white">
          <ShoppingBag className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-base font-bold text-ink-900">{appName}</p>
          <p className="text-xs text-ink-500">{messages.shell.workspace}</p>
        </div>
      </div>

      <nav aria-label={messages.nav.primary} className="flex-1 space-y-6 overflow-y-auto p-4">
        <ul className="space-y-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClass}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {messages.nav[item.labelKey]}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div>
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
            {messages.nav.more}
          </p>
          <ul className="space-y-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink to={item.to} className={linkClass}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                    {messages.nav[item.labelKey]}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
      <div className="border-t border-ink-300/70 p-4">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
          {messages.language.label}
        </p>
        <LanguageSwitch />
      </div>
    </aside>
  );
}
