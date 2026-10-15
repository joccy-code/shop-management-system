import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { registerAccount } from "@/features/auth/api";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas";
import { useAuth, useInvalidateAuth } from "@/features/auth/useAuth";
import { getAppName, t } from "@/i18n";
import { ApiError } from "@/lib/api";

export function RegisterPage() {
  const messages = t().auth;
  const { user, isLoading } = useAuth();
  const invalidateAuth = useInvalidateAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  if (!isLoading && user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await registerAccount({
        shopName: values.shopName,
        displayName: values.displayName,
        phone: values.phone,
        password: values.password,
      });
      // See LoginPage for why navigation is left to the <Navigate> guard
      // above instead of calling navigate() imperatively here.
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
    <div className="flex min-h-dvh items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-6 shadow-soft">
        <div className="space-y-1 text-center">
          <p className="text-sm font-semibold text-brand-700">
            {getAppName()}
          </p>
          <h1 className="text-xl font-bold text-ink-900">
            {messages.registerTitle}
          </h1>
          <p className="text-sm text-ink-500">{messages.registerSubtitle}</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <Input
            label={messages.shopNameLabel}
            autoComplete="organization"
            error={errors.shopName?.message}
            {...register("shopName")}
          />
          <Input
            label={messages.displayNameLabel}
            autoComplete="name"
            error={errors.displayName?.message}
            {...register("displayName")}
          />
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
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Input
            label={messages.confirmPasswordLabel}
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          {formError ? (
            <p role="alert" className="text-sm text-danger-600">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? messages.registering : messages.registerButton}
          </Button>
        </form>

        <p className="text-center text-sm text-ink-500">
          {messages.hasAccount}{" "}
          <Link to="/login" className="font-semibold text-brand-700">
            {messages.loginLink}
          </Link>
        </p>
      </div>
    </div>
  );
}
