import { Home, Package, ReceiptText, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { t, useMessages } from "@/i18n";

const items = [
  { to: "/", labelKey: "home", icon: Home, end: true },
  { to: "/sales", labelKey: "sales", icon: ShoppingCart, end: false },
  { to: "/products", labelKey: "products", icon: Package, end: false },
  { to: "/reports", labelKey: "reports", icon: ReceiptText, end: false },
] as const;

export function BottomNav() {
  useMessages();
  const messages = t();

  return (
    <nav
      aria-label={messages.nav.primary}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-300/80 bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-1 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;
          const label = messages.nav[item.labelKey];
          return (
            <li key={item.to} className="min-w-0">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-16 w-full flex-col items-center justify-center gap-0.5 px-0.5 py-1 text-center text-[11px] font-medium leading-tight ${
                    isActive ? "text-brand-700" : "text-ink-500"
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="w-full text-balance">{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
