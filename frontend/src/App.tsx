import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { CustomersPage } from "@/pages/CustomersPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { ProductsPage } from "@/pages/ProductsPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SalesPage } from "@/pages/SalesPage";
import { SettingsPage } from "@/pages/SettingsPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="expenses" element={<ExpensesPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
