import { Home, Package, ReceiptText, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { t } from "@/i18n";

const items = [
  { to: "/", labelKey: "home", icon: Home, end: true },
  { to: "/sales", labelKey: "sales", icon: ShoppingCart, end: false },
  { to: "/products", labelKey: "products", icon: Package, end: false },
  { to: "/reports", labelKey: "reports", icon: ReceiptText, end: false },
] as const;

export function BottomNav() {
  const messages = t();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-300/80 bg-white/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => {
          const Icon = item.icon;
          const label = messages.nav[item.labelKey];
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-xs font-medium ${
                    isActive ? "text-brand-700" : "text-ink-500"
                  }`
                }
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
