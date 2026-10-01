// src/student/pages/ShopPage.tsx
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Coins, ChevronRight, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlistCart } from "@/hooks/queries/useWishlist";
import { useCoinsQuery } from "@/hooks/queries/useCoins";
import { Product } from "@/services/productService";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, IconButton } from "@/components/ui";
import { ProductCatalog } from "@/components/Shop/ProductCatalog";

export const ShopPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: coinData } = useCoinsQuery();
  const coinBalance = coinData?.balance ?? 0;
  const { addToWishlist, getTotalItems, getItemQuantity, decrementQuantity } = useWishlistCart();

  const handleBuy = (product: Product) => {
    addToWishlist(product);
  };

  return (
    <ProductCatalog
      headerActions={
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
      }
      renderProductAction={(product) =>
        getItemQuantity(product.id) > 0 ? (
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
        )
      }
    >
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
    </ProductCatalog>
  );
};
