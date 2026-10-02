// src/student/components/shop/ProductCatalog.tsx
// Student-only "Do'kon" catalog (space theme): search, category chips and the
// product grid. Same data + filtering as the shared components/Shop catalog
// (which the teacher panel keeps using); cart controls are plugged in by the page.
import { useMemo, useState, type ReactNode } from "react";
import { isImageUrl } from "@/lib/utils";
import { getErrorMessage } from "@/lib/toast";
import { useProductsQuery } from "@/hooks/queries/useProducts";
import type { Product } from "@/services/productService";
import { useTranslation } from "@/hooks/useTranslation";
import { EmptyState, ErrorState, SearchBox, Skel } from "../ui";

const ALL = "Hammasi";

/** GET /products also returns the DB `stock` column (null = unlimited). */
export const productStock = (p: { stock?: number | null }) =>
  typeof p.stock === "number" ? p.stock : null;

export const ProductImage = ({
  image,
  name,
}: {
  image: string;
  name: string;
}) =>
  isImageUrl(image) ? (
    <img src={image} alt={name} loading="lazy" />
  ) : (
    <span className="sp-shop-emoji" aria-hidden="true">
      {image || "🎁"}
    </span>
  );

export interface CartControls {
  quantity: (productId: string) => number;
  add: (product: Product) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
}

const ProductGridSkeleton = () => (
  <div aria-busy="true">
    <Skel className="h-12" />
    <div className="flex gap-2 my-3.5">
      <Skel className="h-9 w-24" />
      <Skel className="h-9 w-20" />
      <Skel className="h-9 w-24" />
    </div>
    <div className="sp-prods sp-shop-products">
      {Array.from({ length: 6 }, (_, i) => (
        <Skel key={i} className="h-72" />
      ))}
    </div>
  </div>
);

const ProductCard = ({
  product,
  cart,
}: {
  product: Product;
  cart: CartControls;
}) => {
  const { t } = useTranslation();
  const qty = cart.quantity(product.id);
  const stock = productStock(product as Product & { stock?: number | null });
  const soldOut = stock === 0;
  const atLimit = stock !== null && qty >= stock;
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0;

  return (
    <article
      className={
        soldOut
          ? "sp-prod sp-shop-out sp-shop-product-card"
          : "sp-prod sp-shop-product-card"
      }
    >
      <div className="sp-prod-img">
        <ProductImage image={product.image} name={product.name} />
        <div className="sp-shop-badges">
          {soldOut && (
            <span className="sp-badge sp-mute">
              {t("space.shop.outOfStock")}
            </span>
          )}
          {product.isPopular && (
            <span className="sp-badge sp-sun">⚡ {t("shop.popular")}</span>
          )}
          {product.isNew && (
            <span className="sp-badge">✨ {t("shop.new")}</span>
          )}
          {product.isLimited && (
            <span className="sp-badge sp-pink">🎁 {t("shop.limited")}</span>
          )}
        </div>
        {!soldOut && (
          <button
            type="button"
            className="sp-heart"
            aria-pressed={qty > 0}
            aria-label={
              qty > 0
                ? t("space.shop.removeFromCart")
                : t("space.shop.addToCart")
            }
            onClick={() =>
              qty > 0 ? cart.remove(product.id) : cart.add(product)
            }
          >
            {qty > 0 ? "💖" : "🤍"}
          </button>
        )}
        {discount > 0 && <span className="sp-shop-off">-{discount}%</span>}
      </div>

      <b>{product.name}</b>
      {product.description && (
        <p className="sp-shop-desc">{product.description}</p>
      )}

      <div className="sp-shop-meta">
        <span>
          ⭐ {product.rating ?? 0} (
          {t("shop.reviewsSuffix", { count: product.reviews ?? 0 })})
        </span>
        {stock !== null && stock > 0 && (
          <span>{t("space.shop.left", { n: stock })}</span>
        )}
      </div>

      <div className="sp-price">
        💎 {product.price}
        {product.originalPrice ? <s>{product.originalPrice}</s> : null}
      </div>

      <div className="sp-shop-act">
        {soldOut ? (
          <button className="sp-cta" disabled>
            {t("space.shop.outOfStock")}
          </button>
        ) : qty > 0 ? (
          <div className="sp-qty" role="group" aria-label={product.name}>
            <button
              type="button"
              onClick={() => cart.decrement(product.id)}
              aria-label={t("space.shop.dec")}
            >
              −
            </button>
            <span aria-live="polite">{qty}</span>
            <button
              type="button"
              onClick={() => cart.add(product)}
              disabled={atLimit}
              aria-label={t("space.shop.inc")}
            >
              +
            </button>
          </div>
        ) : (
          <button className="sp-cta" onClick={() => cart.add(product)}>
            {t("shop.buy")}
          </button>
        )}
      </div>
    </article>
  );
};

export const ProductCatalog = ({
  header,
  cart,
  children,
}: {
  /** Page header (title, balance, cart button). */
  header: ReactNode;
  cart: CartControls;
  /** Rendered after the grid (floating cart button). */
  children?: ReactNode;
}) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const { data, isLoading, error, refetch, isFetching } = useProductsQuery();
  const products = data ?? [];

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(products.map((p) => p.category))).sort()],
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

  const query = search.trim().toLowerCase();
  const filtered = products.filter((p) => {
    const matchesSearch =
      !query ||
      (p.name ?? "").toLowerCase().includes(query) ||
      (p.description ?? "").toLowerCase().includes(query);
    return matchesSearch && (category === ALL || p.category === category);
  });

  const clearFilters = () => {
    setSearch("");
    setCategory(ALL);
  };

  let body: ReactNode;
  if (isLoading) {
    body = <ProductGridSkeleton />;
  } else if (error && !data) {
    body = (
      <ErrorState
        message={getErrorMessage(error, t("common.error"))}
        onRetry={() => refetch()}
      />
    );
  } else if (products.length === 0) {
    body = (
      <EmptyState
        emoji="🛸"
        title={t("shop.notFound")}
        text={t("shop.noProductsYet")}
      />
    );
  } else {
    body = (
      <>
        <SearchBox
          value={search}
          onChange={setSearch}
          placeholder={t("shop.searchPlaceholder")}
        />
        <div
          className="sp-chipbar sp-shop-categories"
          role="toolbar"
          aria-label={t("shop.category")}
        >
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? "on" : undefined}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {categoryLabels[c] ?? c}
            </button>
          ))}
        </div>
        {filtered.length === 0 ? (
          <EmptyState
            emoji="🔭"
            title={t("space.shop.noResults")}
            text={
              query
                ? t("shop.noSearchResults", { query: search.trim() })
                : t("space.shop.noResultsCategory")
            }
            action={
              <button className="sp-cta" onClick={clearFilters}>
                {t("space.shop.clearFilters")}
              </button>
            }
          />
        ) : (
          <div className="sp-prods sp-shop-products" aria-busy={isFetching}>
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} cart={cart} />
            ))}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="sp-page">
      {header}
      {body}
      {children}
    </div>
  );
};
