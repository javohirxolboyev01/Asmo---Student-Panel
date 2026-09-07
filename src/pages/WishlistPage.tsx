// src/pages/WishlistPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Coins,
  Check,
} from "lucide-react";
import { cn, isImageUrl } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlistStore";
import { shopService } from "@/services/shopService";
import { coinService } from "@/services/coinService";
import { useTranslation } from "@/hooks/useTranslation";
import { Skeleton, SkeletonList } from "@/components/common/Skeleton";
import { Button, IconButton } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";

export const WishlistPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, isLoading, removeFromWishlist, updateQuantity, getTotalCoins, getTotalItems, clearWishlist, fetchWishlist } = useWishlistStore();
  const [coinBalance, setCoinBalance] = useState(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
    coinService.getCoins().then((result) => setCoinBalance(result.balance));
  }, [fetchWishlist]);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setCheckoutError(null);
    try {
      await shopService.checkout(
        items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      );
      toast.success(t("wishlist.checkoutSuccess"));
      clearWishlist();
      navigate("/shop");
    } catch (error) {
      const message = getErrorMessage(error, t("wishlist.checkoutError"));
      setCheckoutError(message);
      toast.error(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className={cn('space-y-4', 'md:space-y-6', 'pb-20')}>
      {/* Header */}
      <div className={cn('flex', 'items-center', 'justify-between')}>
        <div>
          <h1 className={cn('text-lg', 'md:text-xl', 'font-bold', 'text-gray-800 dark:text-gray-100', 'flex', 'items-center', 'gap-2')}>
            <ShoppingBag className={cn('w-7', 'h-7', 'text-warning')} />
            {t("wishlist.title")}
          </h1>
          <p className={cn('text-gray-500', 'text-sm', 'md:text-base')}>
            {t("wishlist.itemsSelected", { count: getTotalItems() })}
          </p>
        </div>
        <div className={cn('bg-white dark:bg-card-dark', 'px-4', 'py-2', 'rounded-2xl', 'shadow-sm', 'border', 'border-gray-100 dark:border-gray-800', 'flex', 'items-center', 'gap-2')}>
          <Coins className={cn('w-4', 'h-4', 'text-warning')} />
          <span className={cn('text-sm', 'font-bold', 'text-gray-800 dark:text-gray-100')}>{coinBalance}</span>
        </div>
      </div>

      {isLoading ? (
        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-6')}>
          <div className={cn('lg:col-span-2')}>
            <SkeletonList rows={3} />
          </div>
          <Skeleton className="w-full h-64 rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <div className={cn('card', 'p-12', 'text-center')}>
          <ShoppingBag className={cn('w-16', 'h-16', 'text-gray-300', 'mx-auto', 'mb-4')} />
          <h3 className={cn('text-lg', 'font-semibold', 'text-gray-800 dark:text-gray-100', 'mb-1')}>
            {t("wishlist.empty")}
          </h3>
          <p className={cn('text-gray-400', 'text-sm', 'mb-4')}>
            {t("wishlist.emptyDesc")}
          </p>
          <Button onClick={() => navigate("/shop")}>{t("wishlist.backToShop")}</Button>
        </div>
      ) : (
        <div className={cn('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-6')}>
          {/* Products List */}
          <div className={cn('lg:col-span-2', 'space-y-4')}>
            {items.map((item) => (
              <div
                key={item.id}
                className={cn('card', 'p-5', 'flex', 'gap-4', 'hover:shadow-card-hover', 'transition-all', 'duration-200')}
              >
                {/* Product Image */}
                <div className={cn('w-24', 'h-24', 'bg-gradient-to-br', 'from-blue-50', 'to-purple-50', 'dark:from-blue-500/10', 'dark:to-purple-500/10', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'text-4xl', 'flex-shrink-0', 'overflow-hidden')}>
                  {isImageUrl(item.image) ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    item.image
                  )}
                </div>

                {/* Product Info */}
                <div className={cn('flex-1', 'min-w-0')}>
                  <h3 className={cn('font-bold', 'text-gray-800 dark:text-gray-100', 'text-lg')}>
                    {item.name}
                  </h3>
                  <p className={cn('text-sm', 'text-gray-500', 'mt-1', 'line-clamp-1')}>
                    {item.description}
                  </p>
                  <div className={cn('flex', 'items-center', 'gap-2', 'mt-2')}>
                    <Coins className={cn('w-4', 'h-4', 'text-warning')} />
                    <span className={cn('text-lg', 'font-bold', 'text-gray-800 dark:text-gray-100')}>
                      {item.price}
                    </span>
                    {item.originalPrice && (
                      <span className={cn('text-sm', 'text-gray-400', 'line-through')}>
                        {item.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quantity and Actions */}
                <div className={cn('flex', 'flex-col', 'items-end', 'gap-3')}>
                  <IconButton
                    variant="danger"
                    size="sm"
                    onClick={() => removeFromWishlist(item.id)}
                  >
                    <Trash2 className={cn('w-5', 'h-5')} />
                  </IconButton>

                  <div className={cn('flex', 'items-center', 'gap-2', 'bg-gray-50 dark:bg-white/5', 'rounded-xl', 'p-1')}>
                    <IconButton
                      size="sm"
                      className="w-8 h-8 p-0 rounded-lg bg-white dark:bg-card-dark shadow-sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className={cn('w-4', 'h-4', 'text-gray-600 dark:text-gray-300')} />
                    </IconButton>
                    <span className={cn('w-8', 'text-center', 'font-semibold', 'text-gray-800 dark:text-gray-100')}>
                      {item.quantity}
                    </span>
                    <IconButton
                      size="sm"
                      className="w-8 h-8 p-0 rounded-lg bg-white dark:bg-card-dark shadow-sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className={cn('w-4', 'h-4', 'text-gray-600 dark:text-gray-300')} />
                    </IconButton>
                  </div>

                  <div className={cn('text-right')}>
                    <span className={cn('text-sm', 'text-gray-500')}>{t("wishlist.itemTotal")}</span>
                    <div className={cn('flex', 'items-center', 'gap-1', 'justify-end')}>
                      <Coins className={cn('w-4', 'h-4', 'text-warning')} />
                      <span className={cn('font-bold', 'text-gray-800 dark:text-gray-100')}>
                        {item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Totals */}
          <div className={cn('lg:col-span-1')}>
            <div className={cn('card', 'p-6', 'sticky', 'top-6')}>
              <h2 className={cn('text-xl', 'font-bold', 'text-gray-800 dark:text-gray-100', 'mb-6')}>
                {t("wishlist.cartTotal")}
              </h2>

              <div className={cn('space-y-4', 'mb-6')}>
                <div className={cn('flex', 'justify-between', 'items-center', 'py-3', 'border-b', 'border-gray-100 dark:border-gray-800')}>
                  <span className={cn('text-gray-500', 'text-sm')}>{t("wishlist.productsCount", { count: getTotalItems() })}</span>
                  <div className={cn('flex', 'items-center', 'gap-1')}>
                    <Coins className={cn('w-4', 'h-4', 'text-warning')} />
                    <span className={cn('font-semibold', 'text-gray-800 dark:text-gray-100')}>
                      {getTotalCoins()}
                    </span>
                  </div>
                </div>

                <div className={cn('flex', 'justify-between', 'items-center', 'py-3', 'border-b', 'border-gray-100 dark:border-gray-800')}>
                  <span className={cn('text-gray-500', 'text-sm')}>{t("wishlist.delivery")}</span>
                  <span className={cn('font-semibold', 'text-green-500')}>
                    {t("wishlist.free")}
                  </span>
                </div>

                <div className={cn('flex', 'justify-between', 'items-center', 'py-3')}>
                  <span className={cn('font-bold', 'text-gray-800 dark:text-gray-100')}>{t("wishlist.grandTotal")}</span>
                  <div className={cn('flex', 'items-center', 'gap-1')}>
                    <Coins className={cn('w-5', 'h-5', 'text-warning')} />
                    <span className={cn('text-2xl', 'font-bold', 'text-gray-800 dark:text-gray-100')}>
                      {getTotalCoins()}
                    </span>
                  </div>
                </div>
              </div>

              {checkoutError && (
                <div className={cn('mb-3', 'text-sm', 'text-[#C62828]', 'bg-[#FFEBEE]', 'dark:bg-[#C62828]/15', 'p-3', 'rounded-2xl')}>
                  {checkoutError}
                </div>
              )}

              <Button
                onClick={handleCheckout}
                isLoading={isCheckingOut}
                leftIcon={<Check className="w-5 h-5" />}
                fullWidth
                size="lg"
              >
                {t("shop.buy")}
              </Button>

              <Button variant="ghost" onClick={() => navigate("/shop")} fullWidth className="mt-3">
                {t("wishlist.continueShop")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
