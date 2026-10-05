// src/components/Shop/ProductCatalog.tsx
// Teacher shop catalog (mock `shop` view): header, search + category chips
// and a `cols c3` grid of product cards. The page supplies the products and
// the controls at the bottom of each card.
import { ReactNode, useMemo, useState } from "react";
import { AlertTriangle, Search, ShoppingBag, Star } from "lucide-react";
import { cn, isImageUrl } from "@/lib/utils";
import type { Product } from "@/services/productService";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, Input } from "@/components/ui";
import { CoinTag, EmptyBox, PageHeader, Skel, Tag } from "@/teacher/components/ui";

interface ProductCatalogProps {
  products: Product[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Rendered at the right of the page title. */
  headerActions: ReactNode;
  /** Bottom row of each product card (price / visibility / edit controls). */
  renderProductAction: (product: Product) => ReactNode;
  /** Rendered after the grid (modals). */
  children?: ReactNode;
}

const ALL = "Hammasi";

/** Product picture: its image URL, its emoji, or the mock's bag icon. */
const ProductThumb = ({ product }: { product: Product }) => {
  const [broken, setBroken] = useState(false);
  const image = product.image?.trim() ?? "";
  const length = image.length;
  const isUrl = isImageUrl(image) && !broken;
  const isEmoji = !isUrl && length > 0 && length <= 8;
  return (
    <span
      className="u-mi overflow-hidden"
      style={{ background: "var(--prt)", color: "var(--pr)", width: 54, height: 54 }}
      aria-hidden="true"
    >
      {isUrl ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setBroken(true)}
        />
      ) : isEmoji ? (
        <span className="text-[28px] leading-none">{image}</span>
      ) : (
        <ShoppingBag className="u-i l" strokeWidth={2} />
      )}
    </span>
  );
};

export const ProductCatalog = ({
  products,
  isLoading,
  isError,
  onRetry,
  headerActions,
  renderProductAction,
  children,
}: ProductCatalogProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(ALL);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort()],
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

  const query = searchQuery.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      (product.description ?? "").toLowerCase().includes(query);
    const matchesCategory = selectedCategory === ALL || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  let body: ReactNode;
  if (isLoading) {
    body = (
      <div className="u-cols c3 u-stack" aria-busy="true">
        {Array.from({ length: 6 }, (_, i) => (
          <Skel key={i} className="h-[150px]" />
        ))}
      </div>
    );
  } else if (isError && products.length === 0) {
    body = (
      <EmptyBox
        tone="er"
        icon={AlertTriangle}
        title={t("us.shop.loadError")}
        action={onRetry && <Button onClick={onRetry}>{t("common.retry")}</Button>}
      />
    );
  } else if (filteredProducts.length === 0) {
    body = (
      <EmptyBox
        tone="mu"
        icon={ShoppingBag}
        title={t("shop.notFound")}
        text={searchQuery ? t("shop.noSearchResults", { query: searchQuery }) : t("shop.noProductsYet")}
      />
    );
  } else {
    body = (
      <div className="u-cols c3 u-stack">
        {filteredProducts.map((product) => {
          const hidden = product.isActive === false;
          return (
            <div key={product.id} className="u-card grid content-between gap-3">
              <div className="grid gap-3">
                <div className={cn("flex items-center gap-3", hidden && "opacity-60")}>
                  <ProductThumb product={product} />
                  <div className="min-w-0 flex-1">
                    <b className="block break-words" style={{ fontSize: 17 }}>
                      {product.name}
                    </b>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <CoinTag n={product.price} />
                      {!!product.originalPrice && product.originalPrice > product.price && (
                        <>
                          <s className="u-sub text-sm" style={{ margin: 0 }}>
                            {product.originalPrice}
                          </s>
                          <Tag tone="er">-{Math.round((1 - product.price / product.originalPrice) * 100)}%</Tag>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {product.description && (
                  <p className="u-sub line-clamp-2 text-sm" style={{ margin: 0 }}>
                    {product.description}
                  </p>
                )}
                {(product.isPopular || product.isNew || product.isLimited || product.category || product.reviews > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {product.isPopular && <Tag tone="gd">{t("shop.popular")}</Tag>}
                    {product.isNew && <Tag tone="ok">{t("shop.new")}</Tag>}
                    {product.isLimited && <Tag tone="er">{t("shop.limited")}</Tag>}
                    {product.category && <Tag tone="mu">{categoryLabels[product.category] ?? product.category}</Tag>}
                    {product.reviews > 0 && (
                      <span className="u-sub inline-flex items-center gap-1 text-[13px] font-bold" style={{ margin: 0 }}>
                        <Star className="u-i s" strokeWidth={2} aria-hidden="true" style={{ color: "var(--gd)" }} />
                        {product.rating} ({t("shop.reviewsSuffix", { count: product.reviews })})
                      </span>
                    )}
                  </div>
                )}
              </div>
              {renderProductAction(product)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <PageHeader back={{ to: "/more" }} title={t("shop.title")} subtitle={t("us.shop.subtitle")} right={headerActions} />

      {products.length > 0 && (
        <>
          <Input
            type="search"
            placeholder={t("shop.searchPlaceholder")}
            aria-label={t("shop.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="u-i" strokeWidth={2} aria-hidden="true" />}
          />
          {categories.length > 2 && (
            <div className="u-chips sc my-3.5" role="tablist">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === category}
                  className={cn("u-chip", selectedCategory === category && "sel")}
                  onClick={() => setSelectedCategory(category)}
                >
                  {categoryLabels[category] ?? category}
                </button>
              ))}
            </div>
          )}
          {categories.length <= 2 && <div className="h-3.5" />}
        </>
      )}

      {body}
      {children}
    </>
  );
};
