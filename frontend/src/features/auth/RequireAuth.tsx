import { Navigate, Outlet, useLocation } from "react-router-dom";
import { t, useMessages } from "@/i18n";
import { useAuth } from "./useAuth";

export function RequireAuth() {
  useMessages();
  const { user, isLoading, isUnauthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-500">
        {t().common.loading}
      </div>
    );
  }

  if (isUnauthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
