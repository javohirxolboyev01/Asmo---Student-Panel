// src/pages/ShopPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Star,
  Coins,
  ChevronRight,
  Sparkles,
  Gift,
  Zap,
  Plus,
  Minus,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, isImageUrl } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlistStore";
import { useAuthStore } from "@/stores/authStore";
import { productService, Product } from "@/services/productService";
import { coinService } from "@/services/coinService";
import { SkeletonProductGrid } from "@/components/common/Skeleton";
import { Modal } from "@/components/common/Modal";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, IconButton, Input, Textarea, Checkbox } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";

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
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Hammasi");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coinBalance, setCoinBalance] = useState(0);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmModal } = useConfirm();
  // const [showFilters, setShowFilters] = useState(false);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const getTotalItems = useWishlistStore((state) => state.getTotalItems);
  const getItemQuantity = useWishlistStore((state) => state.getItemQuantity);
  const decrementQuantity = useWishlistStore((state) => state.decrementQuantity);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);

  const categories = useMemo(
    () => ["Hammasi", ...Array.from(new Set(products.map((p) => p.category))).sort()],
    [products],
  );

  const categoryLabels: Record<string, string> = {
    Hammasi: t("shop.categoryAll"),
    Kurslar: t("shop.categoryCourses"),
    Xizmatlar: t("shop.categoryServices"),
    Mahsulotlar: t("shop.categoryProducts"),
    Chegirmalar: t("shop.categoryDiscounts"),
    service: t("shop.categoryServices"),
    product: t("shop.categoryProducts"),
    course: t("shop.categoryCourses"),
    discount: t("shop.categoryDiscounts"),
  };

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const result = await productService.getProducts();
      setProducts(result);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    if (isTeacher) return;
    fetchWishlist();
    coinService.getCoins().then((result) => setCoinBalance(result.balance));
  }, [fetchWishlist, isTeacher]);

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
        await productService.updateProduct(editingProduct.id, payload);
      } else {
        await productService.createProduct(payload);
      }
      setIsProductModalOpen(false);
      loadProducts();
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
      await productService.deleteProduct(id);
      loadProducts();
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Hammasi" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBuy = (product: Product) => {
    addToWishlist(product);
  };

  return (
    <div className={cn('space-y-4', 'md:space-y-6', 'pb-20')}>
      {/* Header */}
      <div className={cn('flex', 'items-center', 'justify-between')}>
        <div>
          <h1 className={cn('text-lg', 'md:text-xl', 'font-bold', 'text-gray-800 dark:text-gray-100', 'flex', 'items-center', 'gap-2')}>
            <ShoppingBag className={cn('w-7', 'h-7', 'text-warning')} />
            {t("shop.title")}
          </h1>
          <p className={cn('text-gray-500', 'text-sm', 'md:text-base')}>
            {t("shop.subtitle")}
          </p>
        </div>
        <div className={cn('flex', 'items-center', 'gap-3')}>
          {isTeacher ? (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreateProduct}>
              <span className="hidden sm:inline">{t("shop.addProduct")}</span>
            </Button>
          ) : (
            <>
              <div className={cn('bg-white dark:bg-card-dark', 'px-4', 'py-2', 'rounded-2xl', 'shadow-sm', 'border', 'border-gray-100 dark:border-gray-800', 'flex', 'items-center', 'gap-2')}>
                <Coins className={cn('w-4', 'h-4', 'text-warning')} />
                <span className={cn('text-sm', 'font-bold', 'text-gray-800 dark:text-gray-100')}>{coinBalance}</span>
              </div>
              <div className="relative">
                <IconButton
                  onClick={() => navigate("/wishlist")}
                  size="lg"
                  className={cn('rounded-2xl', 'bg-warning/10', 'hover:bg-warning/20', 'text-warning')}
                >
                  <ShoppingBag className={cn('w-5', 'h-5')} />
                  {getTotalItems() > 0 && (
                    <span className={cn('absolute', '-top-1', '-right-1', 'w-5', 'h-5', 'bg-red-500', 'text-white', 'text-xs', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
                      {getTotalItems()}
                    </span>
                  )}
                </IconButton>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className={cn('flex', 'flex-col', 'sm:flex-row', 'gap-3')}>
        <Input
          type="text"
          placeholder={t("shop.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          containerClassName="flex-1"
        />
        {/* <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn('px-5', 'py-3.5', 'bg-white dark:bg-card-dark', 'rounded-2xl', 'border', 'border-gray-200 dark:border-gray-700', 'flex', 'items-center', 'gap-2', 'hover:border-warning', 'transition-colors')}
        >
          <Filter className={cn('w-4', 'h-4', 'text-gray-500')} />
          <span className={cn('text-sm', 'text-gray-500')}>Filter</span>
        </button> */}
      </div>

      {/* Categories */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div
          className={cn('flex', 'gap-2', 'overflow-x-auto', 'pb-2', 'scrollbar-hide')}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 sm:px-4 sm:py-2 sm:text-sm",
                selectedCategory === category
                  ? "bg-warning text-white shadow-sm"
                  : "bg-white dark:bg-card-dark text-gray-500 hover:text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700",
              )}
            >
              {categoryLabels[category] ?? category}
            </button>
          ))}
        </div>
        {/* Scroll hint — sees a chip cut off + fade instead of an abrupt edge */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-background dark:from-background-dark to-transparent sm:hidden" />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <SkeletonProductGrid count={6} />
      ) : (
      <div className={cn('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3', 'gap-4')}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={cn('card', 'hover:shadow-card-hover', 'transition-all', 'duration-200', 'hover:scale-[1.01]', 'group')}
          >
            <div className="p-5">
              {/* Product Image */}
              <div className="relative">
                <div className={cn('w-full', 'h-40', 'bg-gradient-to-br', 'from-blue-50', 'to-purple-50', 'dark:from-blue-500/10', 'dark:to-purple-500/10', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'text-6xl', 'overflow-hidden')}>
                  {isImageUrl(product.image) ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    product.image
                  )}
                </div>
                {/* Badges */}
                <div className={cn('absolute', 'top-3', 'left-3', 'flex', 'gap-1.5')}>
                  {product.isPopular && (
                    <span className={cn('px-2', 'py-1', 'bg-warning', 'text-white', 'text-xs', 'font-medium', 'rounded-full', 'flex', 'items-center', 'gap-1')}>
                      <Zap className={cn('w-3', 'h-3')} />
                      {t("shop.popular")}
                    </span>
                  )}
                  {product.isNew && (
                    <span className={cn('px-2', 'py-1', 'bg-green-500', 'text-white', 'text-xs', 'font-medium', 'rounded-full', 'flex', 'items-center', 'gap-1')}>
                      <Sparkles className={cn('w-3', 'h-3')} />
                      {t("shop.new")}
                    </span>
                  )}
                  {product.isLimited && (
                    <span className={cn('px-2', 'py-1', 'bg-red-500', 'text-white', 'text-xs', 'font-medium', 'rounded-full', 'flex', 'items-center', 'gap-1')}>
                      <Gift className={cn('w-3', 'h-3')} />
                      {t("shop.limited")}
                    </span>
                  )}
                </div>
                {/* Discount Badge */}
                {product.originalPrice && (
                  <div className={cn('absolute', 'bottom-3', 'right-3', 'px-2', 'py-1', 'bg-red-500', 'text-white', 'text-xs', 'font-bold', 'rounded-full')}>
                    -
                    {Math.round(
                      (1 - product.price / product.originalPrice) * 100,
                    )}
                    %
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="mt-4">
                <div className={cn('flex', 'items-start', 'justify-between')}>
                  <div className={cn('flex-1', 'min-w-0')}>
                    <h3 className={cn('font-bold', 'text-gray-800 dark:text-gray-100', 'text-lg', 'group-hover:text-warning', 'transition-colors')}>
                      {product.name}
                    </h3>
                    <p className={cn('text-sm', 'text-gray-500', 'mt-1', 'line-clamp-2')}>
                      {product.description}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div className={cn('flex', 'items-center', 'gap-1.5', 'mt-2')}>
                  <Star className={cn('w-4', 'h-4', 'fill-warning', 'text-warning')} />
                  <span className={cn('text-sm', 'font-medium', 'text-gray-800 dark:text-gray-100')}>
                    {product.rating}
                  </span>
                  <span className={cn('text-sm', 'text-gray-400')}>
                    ({t("shop.reviewsSuffix", { count: product.reviews })})
                  </span>
                </div>

                {/* Price */}
                <div className={cn('flex', 'items-end', 'justify-between', 'mt-3', 'pt-3', 'border-t', 'border-gray-100 dark:border-gray-800')}>
                  <div>
                    <div className={cn('flex', 'items-center', 'gap-2')}>
                      <Coins className={cn('w-4', 'h-4', 'text-warning')} />
                      <span className={cn('text-xl', 'font-bold', 'text-gray-800 dark:text-gray-100')}>
                        {product.price}
                      </span>
                    </div>
                    {product.originalPrice && (
                      <span className={cn('text-sm', 'text-gray-400', 'line-through', 'ml-6')}>
                        {product.originalPrice}
                      </span>
                    )}
                  </div>
                  {isTeacher ? (
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
                  ) : getItemQuantity(product.id) > 0 ? (
                    <div className={cn('flex', 'items-center', 'gap-2', 'bg-gray-50 dark:bg-white/5', 'rounded-xl', 'p-1')}>
                      <IconButton
                        size="sm"
                        className="w-8 h-8 p-0 rounded-lg bg-white dark:bg-card-dark shadow-sm"
                        onClick={() => decrementQuantity(product.id)}
                      >
                        <Minus className={cn('w-4', 'h-4', 'text-gray-600 dark:text-gray-300')} />
                      </IconButton>
                      <span className={cn('w-8', 'text-center', 'font-semibold', 'text-gray-800 dark:text-gray-100')}>
                        {getItemQuantity(product.id)}
                      </span>
                      <IconButton
                        size="sm"
                        className="w-8 h-8 p-0 rounded-lg bg-white dark:bg-card-dark shadow-sm"
                        onClick={() => handleBuy(product)}
                      >
                        <Plus className={cn('w-4', 'h-4', 'text-gray-600 dark:text-gray-300')} />
                      </IconButton>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleBuy(product)}
                    >
                      {t("shop.buy")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredProducts.length === 0 && (
        <div className={cn('card', 'p-12', 'text-center')}>
          <ShoppingBag className={cn('w-16', 'h-16', 'text-gray-300', 'mx-auto', 'mb-4')} />
          <h3 className={cn('text-lg', 'font-semibold', 'text-gray-800 dark:text-gray-100', 'mb-1')}>
            {t("shop.notFound")}
          </h3>
          <p className={cn('text-gray-400', 'text-sm')}>
            {searchQuery
              ? t("shop.noSearchResults", { query: searchQuery })
              : t("shop.noProductsYet")}
          </p>
        </div>
      )}

      {/* Cart Floating Button */}
      {getTotalItems() > 0 && (
        <Button
          onClick={() => navigate("/wishlist")}
          leftIcon={<ShoppingBag className={cn('w-5', 'h-5')} />}
          rightIcon={<ChevronRight className={cn('w-5', 'h-5')} />}
          className={cn('fixed', 'bottom-24', 'md:bottom-8', 'left-1/2', '-translate-x-1/2', 'shadow-lg', 'shadow-warning/30', 'gap-3', 'animate-bounce-in', 'z-30')}
        >
          {t("shop.cartItems", { count: getTotalItems() })}
        </Button>
      )}

      {isTeacher && (
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
      )}
      {confirmModal}

      <style>{`
        @keyframes bounce-in {
          0% { transform: translate(-50%, 100%) scale(0.8); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
