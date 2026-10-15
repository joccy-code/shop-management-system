import type { PropsWithChildren, SelectHTMLAttributes } from "react";
import { useId } from "react";

type SelectProps = PropsWithChildren<
  SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: string | undefined;
  }
>;

export function Select({
  label,
  error,
  id,
  className = "",
  children,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="min-w-0 max-w-full space-y-1.5">
      <label
        htmlFor={selectId}
        className="block text-sm font-semibold text-ink-900"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={`min-h-12 w-full min-w-0 max-w-full rounded-xl border bg-white px-3.5 text-base text-ink-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-200 ${
          error ? "border-danger-600" : "border-ink-300"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-danger-600">{error}</p> : null}
    </div>
  );
}
