// src/student/pages/WishlistPage.tsx
// Cart (backend wishlist) in the space theme: quantity stepper, totals vs the
// coin balance, confirm → POST /shop/checkout → success modal.
import "../theme/shop.css";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useWishlistCart, useWishlistQuery, useCheckoutMutation } from "@/hooks/queries/useWishlist";
import { useCoinsQuery } from "@/hooks/queries/useCoins";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import { queryKeys } from "@/lib/queryClient";
import { EmptyState, ErrorState, Modal, PageHeader, Skel, Spinner, burst } from "../components/ui";
import { ProductImage, productStock } from "../components/shop/ProductCatalog";

const CartSkeleton = () => (
  <div className="sp-shop-cart" aria-busy="true">
    <div>
      <Skel className="h-[84px] mb-2.5" />
      <Skel className="h-[84px] mb-2.5" />
      <Skel className="h-[84px] mb-2.5" />
    </div>
    <Skel className="h-72" />
  </div>
);

export const WishlistPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { items, isLoading, removeFromWishlist, updateQuantity, getTotalCoins, getTotalItems } =
    useWishlistCart();
  const wishlist = useWishlistQuery();
  const coins = useCoinsQuery();
  const checkout = useCheckoutMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ total: number; balance: number } | null>(null);
  const successIcon = useRef<HTMLDivElement>(null);

  const totalCoins = getTotalCoins();
  const totalItems = getTotalItems();
  const balance = coins.data?.balance ?? 0;
  const balanceKnown = Boolean(coins.data);
  const shortBy = Math.max(0, totalCoins - balance);
  const canCheckout = items.length > 0 && balanceKnown && shortBy === 0 && !checkout.isPending;

  useEffect(() => {
    if (!success) return;
    const id = window.setTimeout(() => burst(successIcon.current, "💎", 8), 150);
    return () => window.clearTimeout(id);
  }, [success]);

  const explainError = (error: unknown) => {
    const message = getErrorMessage(error, t("wishlist.checkoutError"));
    if (/insufficient/i.test(message)) return t("space.shop.errInsufficient");
    if (/product not found/i.test(message)) {
      return items.some((i) => i.quantity > 1) ? t("space.shop.errQty") : t("space.shop.errNotFound");
    }
    return message;
  };

  const handleCheckout = () => {
    if (!canCheckout) return;
    setCheckoutError(null);
    const total = totalCoins;
    checkout.mutate(
      items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      {
        onSuccess: (res) => {
          const serverBalance = (res as { balance?: unknown } | undefined)?.balance;
          setConfirmOpen(false);
          setSuccess({ total, balance: typeof serverBalance === "number" ? serverBalance : balance - total });
          // The HUD pill reads the dashboard's coinBalance.
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
        },
        onError: (error) => {
          setCheckoutError(explainError(error));
          // Balance may have changed elsewhere — refresh it.
          coins.refetch();
        },
      },
    );
  };

  const header = (
    <PageHeader
      back={{ to: "/shop", label: t("shop.title") }}
      title={`🛒 ${t("wishlist.title")}`}
      subtitle={t("wishlist.itemsSelected", { count: totalItems })}
      right={
        <Link to="/coins" className="sp-pill" aria-label={t("space.shop.balanceAria", { n: balance })}>
          💎 <span>{balanceKnown ? balance : "…"}</span>
        </Link>
      }
    />
  );

  let body: ReactNode;
  if (isLoading) {
    body = <CartSkeleton />;
  } else if (wishlist.error) {
    body = (
      <ErrorState
        message={getErrorMessage(wishlist.error, t("common.error"))}
        onRetry={() => wishlist.refetch()}
      />
    );
  } else if (items.length === 0) {
    body = (
      <EmptyState
        emoji="🪐"
        title={t("wishlist.empty")}
        text={t("wishlist.emptyDesc")}
        action={
          <Link to="/shop" className="sp-cta inline-block no-underline">
            {t("wishlist.backToShop")}
          </Link>
        }
      />
    );
  } else {
    body = (
      <div className="sp-shop-cart">
        <div>
          {items.map((item) => {
            const stock = productStock(item as typeof item & { stock?: number | null });
            return (
              <div key={item.id} className="sp-row sp-shop-item">
                <div className="sp-ic">
                  <ProductImage image={item.image} name={item.name} />
                </div>
                <div className="sp-t">
                  <b>{item.name}</b>
                  {item.description && <small>{item.description}</small>}
                  <div className="sp-price">
                    💎 {item.price}
                    {item.originalPrice ? <s>{item.originalPrice}</s> : null}
                  </div>
                </div>
                <button
                  type="button"
                  className="sp-shop-rm"
                  onClick={() => removeFromWishlist(item.id)}
                  disabled={checkout.isPending}
                  aria-label={`${t("space.shop.removeFromCart")}: ${item.name}`}
                  title={t("space.shop.removeFromCart")}
                >
                  🗑
                </button>
                <div className="sp-shop-ctl">
                  <div className="sp-qty" role="group" aria-label={item.name}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={checkout.isPending}
                      aria-label={t("space.shop.dec")}
                    >
                      −
                    </button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={checkout.isPending || (stock !== null && item.quantity >= stock)}
                      aria-label={t("space.shop.inc")}
                    >
                      +
                    </button>
                  </div>
                  <div className="sp-shop-sum">
                    <small>{t("wishlist.itemTotal")}</small>💎 {item.price * item.quantity}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <aside className="sp-panel sp-shop-summary">
          <h2>{t("wishlist.cartTotal")}</h2>
          <div className="sp-hr">
            <span aria-hidden="true">🛍</span>
            <span>{t("wishlist.productsCount", { count: totalItems })}</span>
            <b>💎 {totalCoins}</b>
          </div>
          <div className="sp-hr">
            <span aria-hidden="true">🚀</span>
            <span>{t("wishlist.delivery")}</span>
            <b style={{ color: "var(--sp-lime-ink)" }}>{t("wishlist.free")}</b>
          </div>
          <div className="sp-hr">
            <span aria-hidden="true">💎</span>
            <span>{t("space.shop.balance")}</span>
            <b>{balanceKnown ? balance : "…"}</b>
          </div>
          {balanceKnown && (
            <div className="sp-hr">
              <span aria-hidden="true">🪙</span>
              <span>{t("space.shop.after")}</span>
              <b style={{ color: shortBy > 0 ? "var(--sp-pink-ink)" : "var(--sp-lime-ink)" }}>
                {balance - totalCoins}
              </b>
            </div>
          )}
          <div className="sp-shop-total">
            <span>{t("wishlist.grandTotal")}</span>
            <b>💎 {totalCoins}</b>
          </div>

          {!balanceKnown && coins.isLoading && <p className="sp-msg">{t("space.shop.balanceLoading")}</p>}
          {coins.error && !balanceKnown && (
            <p className="sp-msg sp-err">
              {getErrorMessage(coins.error, t("common.error"))}{" "}
              <button type="button" className="sp-mute-btn underline" onClick={() => coins.refetch()}>
                {t("common.retry")}
              </button>
            </p>
          )}
          {balanceKnown && shortBy > 0 && (
            <p className="sp-msg sp-err" role="alert">
              {t("space.shop.notEnough", { n: shortBy })}{" "}
              <Link to="/" style={{ color: "var(--sp-ink)" }}>
                {t("space.shop.earnMore")}
              </Link>
            </p>
          )}
          {checkoutError && !confirmOpen && (
            <p className="sp-msg sp-err" role="alert">
              {checkoutError}
            </p>
          )}

          <button className="sp-cta" disabled={!canCheckout} onClick={() => setConfirmOpen(true)}>
            ✓ {t("shop.buy")}
          </button>
          <Link to="/shop" className="sp-cta sp-ghost">
            {t("wishlist.continueShop")}
          </Link>
        </aside>
      </div>
    );
  }

  return (
    <div className="sp-page">
      {header}
      {body}

      <Modal
        open={confirmOpen}
        onClose={() => !checkout.isPending && setConfirmOpen(false)}
        labelledBy="sp-shop-confirm"
      >
        <div className="text-5xl" aria-hidden="true">
          🛍
        </div>
        <h2 id="sp-shop-confirm">{t("space.shop.confirmTitle")}</h2>
        <p>{t("space.shop.confirmText", { count: totalItems, total: totalCoins })}</p>
        <div className="sp-shop-lines">
          {items.map((item) => (
            <div key={item.id} className="sp-hr">
              <span aria-hidden="true">×{item.quantity}</span>
              <span>{item.name}</span>
              <b style={{ color: "var(--sp-sun-ink)" }}>💎 {item.price * item.quantity}</b>
            </div>
          ))}
          <div className="sp-hr">
            <span aria-hidden="true">🪙</span>
            <span>{t("space.shop.after")}</span>
            <b>💎 {balance - totalCoins}</b>
          </div>
        </div>
        {checkoutError && (
          <p className="sp-msg sp-err" role="alert">
            {checkoutError}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <button className="sp-cta sp-ghost" onClick={() => setConfirmOpen(false)} disabled={checkout.isPending}>
            {t("common.cancel")}
          </button>
          <button className="sp-cta" onClick={handleCheckout} disabled={!canCheckout}>
            {checkout.isPending ? <Spinner /> : t("space.shop.confirm")}
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(success)} onClose={() => setSuccess(null)} labelledBy="sp-shop-success">
        {success && (
          <>
            <div className="text-5xl" aria-hidden="true" ref={successIcon}>
              💎
            </div>
            <h2 id="sp-shop-success">{t("space.shop.successTitle")}</h2>
            <p>{t("wishlist.checkoutSuccess")}</p>
            <p>{t("space.shop.successText", { total: success.total, balance: success.balance })}</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link to="/coins" className="sp-cta sp-ghost no-underline">
                {t("space.shop.toCoins")}
              </Link>
              <Link to="/shop" className="sp-cta no-underline">
                {t("wishlist.backToShop")}
              </Link>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
