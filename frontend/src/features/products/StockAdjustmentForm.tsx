import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { t } from "@/i18n";
import { ApiError } from "@/lib/api";
import { adjustStock } from "./api";
import {
  stockAdjustmentFormSchema,
  type StockAdjustmentFormValues,
} from "./schemas";
import type { Product } from "./types";

type StockAdjustmentFormProps = {
  product: Product;
  onCancel: () => void;
  onAdjusted: () => void | Promise<void>;
};

export function StockAdjustmentForm({
  product,
  onCancel,
  onAdjusted,
}: StockAdjustmentFormProps) {
  const messages = t().products;
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentFormSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setSubmitting(true);
    try {
      await adjustStock(product.id, values);
      await onAdjusted();
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : messages.saveError,
      );
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <p className="text-sm text-ink-500">
        {product.name} &middot; {messages.stock}: {product.stockQuantity}
        {product.unitOfMeasure ? ` ${product.unitOfMeasure}` : ""}
      </p>

      <Input
        label={messages.quantityChangeLabel}
        inputMode="decimal"
        placeholder="-2"
        error={errors.quantityChange?.message}
        {...register("quantityChange")}
      />
      <p className="-mt-2 text-xs text-ink-500">
        {messages.quantityChangeHint}
      </p>

      <Input
        label={messages.reasonLabel}
        placeholder={messages.reasonPlaceholder}
        error={errors.reason?.message}
        {...register("reason")}
      />

      {formError ? (
        <p role="alert" className="text-sm text-danger-600">
          {formError}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t().common.cancel}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? messages.saving : messages.saveAdjustment}
        </Button>
      </div>
    </form>
  );
}
