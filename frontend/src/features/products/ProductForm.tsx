import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { t } from "@/i18n";
import { productFormSchema, type ProductFormValues } from "./schemas";
import type { Category, Product } from "./types";

type ProductFormProps = {
  product?: Product | null;
  categories: Category[];
  submitting: boolean;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  onCancel: () => void;
  onCreateCategory: (name: string) => Promise<Category>;
};

export function ProductForm({
  product,
  categories,
  submitting,
  onSubmit,
  onCancel,
  onCreateCategory,
}: ProductFormProps) {
  const messages = t().products;
  const [categoryOptions, setCategoryOptions] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? "",
      categoryId: product?.categoryId ?? "",
      sku: product?.sku ?? "",
      sellingPrice: product?.sellingPrice ?? "",
      unitCost: product?.unitCost ?? "",
      stockQuantity: product?.stockQuantity ?? "0",
      lowStockThreshold: product?.lowStockThreshold ?? "0",
      unitOfMeasure: product?.unitOfMeasure ?? "",
    },
  });

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      return;
    }

    setCreatingCategory(true);
    try {
      const category = await onCreateCategory(name);
      // The new <option> must exist in the DOM before setValue assigns the
      // select's value, otherwise the browser silently ignores the change.
      flushSync(() => {
        setCategoryOptions((previous) => [...previous, category]);
      });
      setValue("categoryId", category.id);
      setNewCategoryName("");
    } finally {
      setCreatingCategory(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label={messages.nameLabel}
        error={errors.name?.message}
        {...register("name")}
      />

      <div className="space-y-2">
        <Select label={messages.categoryLabel} {...register("categoryId")}>
          <option value="">{messages.noCategory}</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <div className="flex gap-2">
          <input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder={messages.newCategoryPlaceholder}
            aria-label={messages.newCategoryPlaceholder}
            className="min-h-11 flex-1 rounded-xl border border-ink-300 px-3 text-sm text-ink-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
          />
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 px-3 text-sm"
            onClick={handleAddCategory}
            disabled={creatingCategory || !newCategoryName.trim()}
          >
            {messages.addCategory}
          </Button>
        </div>
      </div>

      <Input
        label={messages.skuLabel}
        error={errors.sku?.message}
        {...register("sku")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={messages.sellingPriceLabel}
          inputMode="decimal"
          error={errors.sellingPrice?.message}
          {...register("sellingPrice")}
        />
        <Input
          label={messages.unitCostLabel}
          inputMode="decimal"
          error={errors.unitCost?.message}
          {...register("unitCost")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label={messages.stockQuantityLabel}
          inputMode="decimal"
          disabled={Boolean(product)}
          error={errors.stockQuantity?.message}
          {...register("stockQuantity")}
        />
        <Input
          label={messages.lowStockThresholdLabel}
          inputMode="decimal"
          error={errors.lowStockThreshold?.message}
          {...register("lowStockThreshold")}
        />
      </div>

      <Input
        label={messages.unitOfMeasureLabel}
        error={errors.unitOfMeasure?.message}
        {...register("unitOfMeasure")}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          {t().common.cancel}
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? messages.saving : messages.save}
        </Button>
      </div>
    </form>
  );
}
