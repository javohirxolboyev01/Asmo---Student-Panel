// src/components/Shop/ProductCatalog.tsx
import { ReactNode, useMemo, useState } from "react";
import { Search, ShoppingBag, Star, Coins, Sparkles, Gift, Zap } from "lucide-react";
import { cn, isImageUrl } from "@/lib/utils";
import { useProductsQuery } from "@/hooks/queries/useProducts";
import { Product } from "@/services/productService";
import { SkeletonProductGrid } from "@/components/common/Skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui";

interface ProductCatalogProps {
  /** Rendered at the right of the page title. */
  headerActions: ReactNode;
  /** Rendered at the bottom-right of each product card (buy / edit controls). */
  renderProductAction: (product: Product) => ReactNode;
  /** Rendered after the grid (floating cart button, modals). */
  children?: ReactNode;
}

// Product search + category filter + grid shared by the student and teacher
// shop pages; each panel plugs in its own controls through the props above.
export const ProductCatalog = ({ headerActions, renderProductAction, children }: ProductCatalogProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Hammasi");
  const { data: products = [], isLoading } = useProductsQuery();

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

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "Hammasi" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          {headerActions}
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
                  {renderProductAction(product)}
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

      {children}

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
