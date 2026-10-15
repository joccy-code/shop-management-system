import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { Location } from "react-router-dom";
import { Link, Navigate, useLocation } from "react-router-dom";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { login } from "@/features/auth/api";
import { createLoginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useAuth, useInvalidateAuth } from "@/features/auth/useAuth";
import { getAppName, t, useMessages } from "@/i18n";
import { ApiError } from "@/lib/api";

export function LoginPage() {
  useMessages();
  const messages = t().auth;
  const { user, isLoading } = useAuth();
  const invalidateAuth = useInvalidateAuth();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: (values, context, options) =>
      zodResolver(createLoginSchema())(values, context, options),
  });

  if (!isLoading && user) {
    const state = location.state as { from?: Location } | null;
    return <Navigate to={state?.from?.pathname ?? "/"} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await login(values);
      // Re-fetching the current user flips `user` to a truthy value, which
      // triggers the <Navigate> guard above on the next render. Navigating
      // imperatively here too would race that guard and can redirect to a
      // stale `location.state.from` left over from an earlier redirect.
      await invalidateAuth();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : messages.genericError,
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex justify-end">
          <LanguageSwitch />
        </div>
        <div className="space-y-6 rounded-2xl bg-white p-5 shadow-soft sm:p-6">
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-brand-700">
            {getAppName()}
          </p>
          <h1 className="text-xl font-bold text-ink-900">
            {messages.loginTitle}
          </h1>
          <p className="text-sm text-ink-500">{messages.loginSubtitle}</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label={messages.phoneLabel}
            type="tel"
            autoComplete="tel"
            placeholder="0912345678"
            error={errors.phone?.message}
            {...register("phone")}
          />
          <Input
            label={messages.passwordLabel}
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />

          {formError ? (
            <p role="alert" className="text-sm text-danger-600">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? messages.loggingIn : messages.loginButton}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-500">
          {messages.noAccount}{" "}
          <Link to="/register" className="font-semibold text-brand-700">
            {messages.registerLink}
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
