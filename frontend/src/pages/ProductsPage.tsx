import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  archiveProduct,
  createCategory,
  createProduct,
  listCategories,
  listProducts,
  updateProduct,
} from "@/features/products/api";
import { ProductForm } from "@/features/products/ProductForm";
import type { ProductFormValues } from "@/features/products/schemas";
import { StockAdjustmentForm } from "@/features/products/StockAdjustmentForm";
import type { Product } from "@/features/products/types";
import { t, useMessages } from "@/i18n";
import { ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";

type ModalState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; product: Product }
  | { mode: "adjust"; product: Product };

export function ProductsPage() {
  useMessages();
  const messages = t().products;
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [modalState, setModalState] = useState<ModalState>({ mode: "closed" });
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const productsQuery = useQuery({
    queryKey: ["products", search],
    queryFn: () => listProducts(search || undefined),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const closeModal = () => setModalState({ mode: "closed" });

  const invalidateProducts = () =>
    queryClient.invalidateQueries({ queryKey: ["products"] });

  const handleCreateOrUpdate = async (values: ProductFormValues) => {
    setPageError(null);
    setSubmitting(true);
    try {
      if (modalState.mode === "edit") {
        await updateProduct(modalState.product.id, {
          name: values.name,
          categoryId: values.categoryId || null,
          sku: values.sku || null,
          sellingPrice: values.sellingPrice,
          unitCost: values.unitCost,
          lowStockThreshold: values.lowStockThreshold,
          unitOfMeasure: values.unitOfMeasure || null,
        });
      } else {
        await createProduct({
          name: values.name,
          categoryId: values.categoryId || null,
          sku: values.sku || null,
          sellingPrice: values.sellingPrice,
          unitCost: values.unitCost,
          stockQuantity: values.stockQuantity,
          lowStockThreshold: values.lowStockThreshold,
          unitOfMeasure: values.unitOfMeasure || null,
        });
      }
      await invalidateProducts();
      closeModal();
    } catch (error) {
      setPageError(
        error instanceof ApiError ? error.message : messages.saveError,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleArchive = async (product: Product) => {
    if (typeof window !== "undefined" && !window.confirm(messages.archiveConfirm)) {
      return;
    }

    setPageError(null);
    try {
      await archiveProduct(product.id);
      await invalidateProducts();
    } catch (error) {
      setPageError(
        error instanceof ApiError ? error.message : messages.saveError,
      );
    }
  };

  const handleCreateCategory = async (name: string) => {
    const category = await createCategory(name);
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    return category;
  };

  const products = productsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={messages.headline} description={messages.body} />
        <Button
          onClick={() => setModalState({ mode: "create" })}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          {messages.addProduct}
        </Button>
      </div>

      <input
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
        placeholder={messages.searchPlaceholder}
        aria-label={messages.searchPlaceholder}
        className="min-h-12 w-full rounded-xl border border-ink-300 bg-white px-4 text-base text-ink-900 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-200"
      />

      {pageError ? (
        <p role="alert" className="text-sm text-danger-600">
          {pageError}
        </p>
      ) : null}

      {productsQuery.isLoading ? (
        <p className="text-sm text-ink-500">{t().common.loading}</p>
      ) : products.length === 0 ? (
        <EmptyState
          title={messages.emptyTitle}
          description={messages.emptyBody}
        />
      ) : (
        <ul className="space-y-3">
          {products.map((product) => {
            const stock = Number(product.stockQuantity);
            const threshold = Number(product.lowStockThreshold);
            const isOutOfStock = stock <= 0;
            const isLowStock = !isOutOfStock && stock <= threshold;

            return (
              <li
                key={product.id}
                className="rounded-2xl border border-ink-300/70 bg-white p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">
                      {product.name}
                    </p>
                    <p className="text-xs text-ink-500">
                      {product.category?.name ?? messages.noCategory}
                      {product.sku ? ` \u00b7 ${product.sku}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
                    {formatMoney(product.sellingPrice)}
                  </span>
                </div>

                <p
                  className={`mt-3 text-sm ${
                    isOutOfStock
                      ? "font-semibold text-danger-600"
                      : isLowStock
                        ? "font-semibold text-warning-600"
                        : "text-ink-700"
                  }`}
                >
                  {messages.stock}: {product.stockQuantity}
                  {product.unitOfMeasure ? ` ${product.unitOfMeasure}` : ""}
                  {isOutOfStock
                    ? ` \u00b7 ${messages.outOfStock}`
                    : isLowStock
                      ? ` \u00b7 ${messages.lowStock}`
                      : ""}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="min-h-10 px-3 text-sm"
                    onClick={() => setModalState({ mode: "edit", product })}
                  >
                    {messages.editProduct}
                  </Button>
                  <Button
                    variant="secondary"
                    className="min-h-10 px-3 text-sm"
                    onClick={() => setModalState({ mode: "adjust", product })}
                  >
                    {messages.adjustStock}
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-10 px-3 text-sm text-danger-600"
                    onClick={() => void handleArchive(product)}
                  >
                    {messages.archiveProduct}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modalState.mode === "create" || modalState.mode === "edit" ? (
        <Modal
          title={
            modalState.mode === "edit"
              ? messages.editProduct
              : messages.addProduct
          }
          onClose={closeModal}
        >
          <ProductForm
            product={modalState.mode === "edit" ? modalState.product : null}
            categories={categories}
            submitting={submitting}
            onSubmit={handleCreateOrUpdate}
            onCancel={closeModal}
            onCreateCategory={handleCreateCategory}
          />
        </Modal>
      ) : null}

      {modalState.mode === "adjust" ? (
        <Modal title={messages.adjustStock} onClose={closeModal}>
          <StockAdjustmentForm
            product={modalState.product}
            onCancel={closeModal}
            onAdjusted={async () => {
              await invalidateProducts();
              closeModal();
            }}
          />
        </Modal>
      ) : null}
    </section>
  );
}
