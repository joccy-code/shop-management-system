export const en = {
  appNameFallback: "Shop Manager",
  nav: {
    home: "Home",
    sales: "Sales",
    products: "Products",
    reports: "Reports",
    expenses: "Expenses",
    customers: "Customers",
    settings: "Settings",
    more: "More",
    menu: "Menu",
    closeMenu: "Close menu",
  },
  common: {
    loading: "Loading…",
    empty: "Nothing here yet",
    comingSoon: "This section will be available in a later update.",
    connectionRequired: "An internet connection is required to save this.",
    currency: "ETB",
  },
  home: {
    title: "Home",
    headline: "Welcome to your shop",
    body: "Sales, stock, expenses, and reports will appear here once you start recording activity.",
    emptyHint: "No sales or expenses yet. Add products, then record your first sale.",
  },
  sales: {
    title: "Sales",
    headline: "Record a sale",
    body: "Search products, set quantities, and confirm payment. Checkout arrives in the next phase.",
  },
  products: {
    title: "Products",
    headline: "Your inventory",
    body: "Add products with prices and stock levels so sales can update inventory automatically.",
  },
  reports: {
    title: "Reports",
    headline: "Business reports",
    body: "Daily and monthly sales, expenses, low stock, and customer balances will be listed here.",
  },
  expenses: {
    title: "Expenses",
    headline: "Business expenses",
    body: "Track rent, transport, utilities, wages, and other shop costs.",
  },
  customers: {
    title: "Customers",
    headline: "Customer credit",
    body: "Keep light customer records for unpaid or partially paid sales and repayments.",
  },
  settings: {
    title: "Settings",
    headline: "Account settings",
    body: "Manage your shop profile, password, and preferences.",
  },
} as const;

export type Messages = typeof en;
