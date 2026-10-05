// src/teacher/pages/ShopPage.tsx
// Mock `shop` view: product cards with a quick price sheet and a
// Sotuvda / Yashirin switch, plus the full create / edit form and delete.
import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  useManagedProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/hooks/queries/useProducts";
import type { Product } from "@/services/productService";
import { Modal } from "@/components/common/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, Input, Textarea, Checkbox } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { ProductCatalog } from "@/components/Shop/ProductCatalog";
import { Toggle } from "../components/ui";

const EMPTY_PRODUCT_FORM = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  category: "",
  image: "",
  isPopular: false,
  isNew: false,
  isLimited: false,
};

export const ShopPage = () => {
  const { t } = useTranslation();
  const { data: products = [], isLoading, isError, refetch } = useManagedProductsQuery();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceProduct, setPriceProduct] = useState<Product | null>(null);
  const [priceValue, setPriceValue] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { confirm, confirmModal } = useConfirm();
  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation();
  const deleteProduct = useDeleteProductMutation();

  const categories = useMemo(
    () => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(),
    [products],
  );

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT_FORM);
    setIsProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      category: product.category,
      image: product.image,
      isPopular: !!product.isPopular,
      isNew: !!product.isNew,
      isLimited: !!product.isLimited,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.image) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
        category: productForm.category,
        image: productForm.image,
        isPopular: productForm.isPopular,
        isNew: productForm.isNew,
        isLimited: productForm.isLimited,
      };
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      setIsProductModalOpen(false);
      toast.success(editingProduct ? t("common.updateSuccess") : t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const confirmed = await confirm(t("shop.deleteConfirm"));
    if (!confirmed) return;
    try {
      await deleteProduct.mutateAsync(id);
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const openPrice = (product: Product) => {
    setPriceProduct(product);
    setPriceValue(String(product.price));
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceProduct) return;
    const price = Number(priceValue);
    if (priceValue === "" || !Number.isFinite(price) || price < 0) return;
    try {
      await updateProduct.mutateAsync({ id: priceProduct.id, payload: { price } });
      setPriceProduct(null);
      toast.success(t("us.shop.saved"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleToggle = async (product: Product) => {
    const isActive = product.isActive !== false;
    setTogglingId(product.id);
    try {
      await updateProduct.mutateAsync({ id: product.id, payload: { isActive: !isActive } });
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setTogglingId(null);
    }
  };

  const set = <K extends keyof typeof EMPTY_PRODUCT_FORM>(key: K, value: (typeof EMPTY_PRODUCT_FORM)[K]) =>
    setProductForm((f) => ({ ...f, [key]: value }));

  return (
    <ProductCatalog
      products={products}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      headerActions={
        <button type="button" className="u-btn" onClick={openCreateProduct}>
          <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
          {t("us.shop.add")}
        </button>
      }
      renderProductAction={(product) => {
        const on = product.isActive !== false;
        return (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button type="button" className="u-btn soft sm" onClick={() => openPrice(product)}>
                <Pencil className="u-i s" strokeWidth={2} aria-hidden="true" />
                {t("us.shop.price")}
              </button>
              <button
                type="button"
                className="u-ib"
                onClick={() => openEditProduct(product)}
                aria-label={t("shop.editProduct")}
                title={t("shop.editProduct")}
              >
                <Pencil className="u-i s" strokeWidth={2} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="u-ib"
                style={{ color: "var(--er)" }}
                onClick={() => handleDeleteProduct(product.id)}
                aria-label={t("common.delete")}
                title={t("common.delete")}
              >
                <Trash2 className="u-i s" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              disabled={togglingId === product.id}
              onClick={() => handleToggle(product)}
              className="flex items-center gap-2 font-bold disabled:opacity-60"
              style={{ color: "var(--mu)" }}
            >
              {on ? t("us.shop.onSale") : t("us.shop.hidden")}
              <Toggle on={on} />
            </button>
          </div>
        );
      }}
    >
      {/* Full create / edit form */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? t("shop.editProduct") : t("shop.addProduct")}
      >
        <form onSubmit={handleSaveProduct} className="u-stack">
          <Input
            type="text"
            label={t("shop.name")}
            value={productForm.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
          <Textarea
            label={t("shop.description")}
            value={productForm.description}
            onChange={(e) => set("description", e.target.value)}
            className="min-h-[80px]"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              min={0}
              label={t("us.shop.priceCoin")}
              value={productForm.price}
              onChange={(e) => set("price", e.target.value)}
              required
            />
            <Input
              type="number"
              min={0}
              label={t("shop.originalPrice")}
              value={productForm.originalPrice}
              onChange={(e) => set("originalPrice", e.target.value)}
            />
          </div>
          <Input
            type="text"
            list="shop-categories"
            label={t("shop.category")}
            value={productForm.category}
            onChange={(e) => set("category", e.target.value)}
          />
          <datalist id="shop-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Input
            type="text"
            label={t("shop.image")}
            value={productForm.image}
            onChange={(e) => set("image", e.target.value)}
            required
          />
          <div className="flex flex-wrap gap-4">
            <Checkbox
              checked={productForm.isPopular}
              onChange={(e) => set("isPopular", e.target.checked)}
              label={t("shop.popular")}
            />
            <Checkbox
              checked={productForm.isNew}
              onChange={(e) => set("isNew", e.target.checked)}
              label={t("shop.new")}
            />
            <Checkbox
              checked={productForm.isLimited}
              onChange={(e) => set("isLimited", e.target.checked)}
              label={t("shop.limited")}
            />
          </div>
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editingProduct ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick price sheet */}
      <Modal isOpen={!!priceProduct} onClose={() => setPriceProduct(null)} title={t("us.shop.priceTitle")}>
        <form onSubmit={handleSavePrice} className="u-stack">
          {priceProduct && <b className="break-words">{priceProduct.name}</b>}
          <Input
            type="number"
            min={0}
            label={t("us.shop.priceCoin")}
            value={priceValue}
            onChange={(e) => setPriceValue(e.target.value)}
            autoFocus
            required
          />
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setPriceProduct(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" isLoading={updateProduct.isPending}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
      {confirmModal}
    </ProductCatalog>
  );
};
