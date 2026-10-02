// src/student/pages/ShopPage.tsx
// "Do'kon" (space theme): catalog + cart controls. The cart is the backend
// wishlist (quantities are client-side, see useWishlistCart).
import "../theme/shop.css";
import { Link } from "react-router-dom";
import { useWishlistCart } from "@/hooks/queries/useWishlist";
import { useCoinsQuery } from "@/hooks/queries/useCoins";
import { useTranslation } from "@/hooks/useTranslation";
import { PageHeader } from "../components/ui";
import { ProductCatalog, type CartControls } from "../components/shop/ProductCatalog";

export const ShopPage = () => {
  const { t } = useTranslation();
  const { data: coinData, isLoading: coinsLoading } = useCoinsQuery();
  const { addToWishlist, removeFromWishlist, getTotalItems, getItemQuantity, decrementQuantity } =
    useWishlistCart();
  const totalItems = getTotalItems();
  const balance = coinData?.balance ?? 0;

  const cart: CartControls = {
    quantity: getItemQuantity,
    add: addToWishlist,
    decrement: decrementQuantity,
    remove: removeFromWishlist,
  };

  const header = (
    <PageHeader
      title={t("shop.title")}
      subtitle={t("shop.subtitle")}
      right={
        <div className="sp-shop-acts">
          <Link to="/coins" className="sp-pill" aria-label={t("space.shop.balanceAria", { n: balance })}>
            💎 <span>{coinsLoading ? "…" : balance}</span>
          </Link>
          <Link
            to="/wishlist"
            className="sp-pill"
            aria-label={t("space.shop.cartAria", { count: totalItems })}
          >
            🛒
            {totalItems > 0 && <span className="sp-dot">{totalItems > 99 ? "99+" : totalItems}</span>}
          </Link>
        </div>
      }
    />
  );

  return (
    <ProductCatalog header={header} cart={cart}>
      {totalItems > 0 && (
        <Link to="/wishlist" className="sp-cta sp-shop-float">
          🛒 {t("shop.cartItems", { count: totalItems })} ›
        </Link>
      )}
    </ProductCatalog>
  );
};
