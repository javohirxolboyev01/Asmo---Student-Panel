// src/teacher/pages/ShopPage.tsx
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  useProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "@/hooks/queries/useProducts";
import { Product } from "@/services/productService";
import { Modal } from "@/components/common/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, IconButton, Input, Textarea, Checkbox } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { ProductCatalog } from "@/components/Shop/ProductCatalog";

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
  const { data: products = [] } = useProductsQuery();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmModal } = useConfirm();
  const createProduct = useCreateProductMutation();
  const updateProduct = useUpdateProductMutation();
  const deleteProduct = useDeleteProductMutation();

  const categories = useMemo(
    () => ["Hammasi", ...Array.from(new Set(products.map((p) => p.category))).sort()],
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

  const handleSaveProduct = async () => {
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

  return (
    <ProductCatalog
      headerActions={
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateProduct}>
          <span className="hidden sm:inline">{t("shop.addProduct")}</span>
        </Button>
      }
      renderProductAction={(product) => (
        <div className="flex items-center gap-2">
          <IconButton
            size="md"
            className="rounded-lg"
            onClick={() => openEditProduct(product)}
          >
            <Pencil className="w-4 h-4" />
          </IconButton>
          <IconButton
            variant="danger"
            size="md"
            className="rounded-lg"
            onClick={() => handleDeleteProduct(product.id)}
          >
            <Trash2 className="w-4 h-4" />
          </IconButton>
        </div>
      )}
    >
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? t("shop.editProduct") : t("shop.addProduct")}
      >
        <div className="space-y-3">
          <Input
            type="text"
            placeholder={t("shop.name")}
            value={productForm.name}
            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
          />
          <Textarea
            placeholder={t("shop.description")}
            value={productForm.description}
            onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            className="min-h-[80px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="number"
              placeholder={t("shop.price")}
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            />
            <Input
              type="number"
              placeholder={t("shop.originalPrice")}
              value={productForm.originalPrice}
              onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
            />
          </div>
          <Input
            type="text"
            list="shop-categories"
            placeholder={t("shop.category")}
            value={productForm.category}
            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
          />
          <datalist id="shop-categories">
            {categories.filter((c) => c !== "Hammasi").map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Input
            type="text"
            placeholder={t("shop.image")}
            value={productForm.image}
            onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
          />
          <div className="flex flex-wrap gap-4">
            <Checkbox
              checked={productForm.isPopular}
              onChange={(e) => setProductForm({ ...productForm, isPopular: e.target.checked })}
              label={t("shop.popular")}
            />
            <Checkbox
              checked={productForm.isNew}
              onChange={(e) => setProductForm({ ...productForm, isNew: e.target.checked })}
              label={t("shop.new")}
            />
            <Checkbox
              checked={productForm.isLimited}
              onChange={(e) => setProductForm({ ...productForm, isLimited: e.target.checked })}
              label={t("shop.limited")}
            />
          </div>
          <Button onClick={handleSaveProduct} isLoading={isSubmitting} fullWidth>
            {editingProduct ? t("common.update") : t("common.create")}
          </Button>
        </div>
      </Modal>
      {confirmModal}
    </ProductCatalog>
  );
};
