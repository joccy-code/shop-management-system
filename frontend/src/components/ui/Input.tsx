import type { InputHTMLAttributes } from "react";
import { useId } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string | undefined;
};

export function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;

  return (
    <div className="min-w-0 max-w-full space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-sm font-semibold text-ink-900"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`min-h-12 w-full min-w-0 max-w-full rounded-xl border bg-white px-3.5 text-base text-ink-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-200 disabled:bg-ink-100 disabled:text-ink-500 ${
          error ? "border-danger-600" : "border-ink-300"
        } ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-danger-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
