// src/pages/WishlistPage.tsx
import { useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Coins,
  ArrowLeft,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWishlistStore } from "@/stores/wishlistStore";

export const WishlistPage = () => {
  const navigate = useNavigate();
  const { items, removeFromWishlist, updateQuantity, getTotalCoins, getTotalItems, clearWishlist } = useWishlistStore();

  const handleCheckout = () => {
    // Handle checkout logic here
    alert("Sotib olish muvaffaqiyatli amalga oshirildi!");
    clearWishlist();
    navigate("/shop");
  };

  return (
    <div className={cn('space-y-4', 'md:space-y-6', 'pb-20')}>
      {/* Header */}
      <div className={cn('flex', 'items-center', 'justify-between')}>
        <div>
          <button
            onClick={() => navigate(-1)}
            className={cn('inline-flex', 'items-center', 'gap-2', 'text-gray-500', 'hover:text-[#2D6BFF]', 'transition-colors', 'text-sm', 'mb-2')}
          >
            <ArrowLeft className={cn('w-4', 'h-4')} />
            Orqaga
          </button>
          <h1 className={cn('text-2xl', 'md:text-3xl', 'font-bold', 'text-[#1A1D26]', 'flex', 'items-center', 'gap-2')}>
            <ShoppingBag className={cn('w-7', 'h-7', 'text-[#2D6BFF]')} />
            Savat
          </h1>
          <p className={cn('text-gray-500', 'text-sm', 'md:text-base')}>
            {getTotalItems()} ta mahsulot tanlangan
          </p>
        </div>
        <div className={cn('bg-white', 'px-4', 'py-2', 'rounded-2xl', 'shadow-sm', 'border', 'border-gray-100', 'flex', 'items-center', 'gap-2')}>
          <Coins className={cn('w-4', 'h-4', 'text-[#F59E0B]')} />
          <span className={cn('text-sm', 'font-bold', 'text-[#1A1D26]')}>150</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className={cn('card', 'p-12', 'text-center')}>
          <ShoppingBag className={cn('w-16', 'h-16', 'text-gray-300', 'mx-auto', 'mb-4')} />
          <h3 className={cn('text-lg', 'font-semibold', 'text-[#1A1D26]', 'mb-1')}>
            Savat bo'sh
          </h3>
          <p className={cn('text-gray-400', 'text-sm', 'mb-4')}>
            Hozircha hech qanday mahsulot tanlanmagan
          </p>
          <button
            onClick={() => navigate("/shop")}
            className={cn('px-6', 'py-3', 'bg-[#2D6BFF]', 'text-white', 'rounded-2xl', 'font-medium', 'hover:bg-[#1A56E8]', 'transition-colors')}
          >
            Do'konga qaytish
          </button>
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
                <div className={cn('w-24', 'h-24', 'bg-gradient-to-br', 'from-blue-50', 'to-purple-50', 'rounded-2xl', 'flex', 'items-center', 'justify-center', 'text-4xl', 'flex-shrink-0')}>
                  {item.image}
                </div>

                {/* Product Info */}
                <div className={cn('flex-1', 'min-w-0')}>
                  <h3 className={cn('font-bold', 'text-[#1A1D26]', 'text-lg')}>
                    {item.name}
                  </h3>
                  <p className={cn('text-sm', 'text-gray-500', 'mt-1', 'line-clamp-1')}>
                    {item.description}
                  </p>
                  <div className={cn('flex', 'items-center', 'gap-2', 'mt-2')}>
                    <Coins className={cn('w-4', 'h-4', 'text-[#F59E0B]')} />
                    <span className={cn('text-lg', 'font-bold', 'text-[#1A1D26]')}>
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
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className={cn('text-gray-400', 'hover:text-red-500', 'transition-colors')}
                  >
                    <Trash2 className={cn('w-5', 'h-5')} />
                  </button>

                  <div className={cn('flex', 'items-center', 'gap-2', 'bg-gray-50', 'rounded-xl', 'p-1')}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={cn('w-8', 'h-8', 'bg-white', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'hover:bg-gray-100', 'transition-colors', 'shadow-sm')}
                    >
                      <Minus className={cn('w-4', 'h-4', 'text-gray-600')} />
                    </button>
                    <span className={cn('w-8', 'text-center', 'font-semibold', 'text-[#1A1D26]')}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={cn('w-8', 'h-8', 'bg-white', 'rounded-lg', 'flex', 'items-center', 'justify-center', 'hover:bg-gray-100', 'transition-colors', 'shadow-sm')}
                    >
                      <Plus className={cn('w-4', 'h-4', 'text-gray-600')} />
                    </button>
                  </div>

                  <div className={cn('text-right')}>
                    <span className={cn('text-sm', 'text-gray-500')}>Jami:</span>
                    <div className={cn('flex', 'items-center', 'gap-1', 'justify-end')}>
                      <Coins className={cn('w-4', 'h-4', 'text-[#F59E0B]')} />
                      <span className={cn('font-bold', 'text-[#1A1D26]')}>
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
              <h2 className={cn('text-xl', 'font-bold', 'text-[#1A1D26]', 'mb-6')}>
                Savat jami
              </h2>

              <div className={cn('space-y-4', 'mb-6')}>
                <div className={cn('flex', 'justify-between', 'items-center', 'py-3', 'border-b', 'border-gray-100')}>
                  <span className={cn('text-gray-500', 'text-sm')}>Mahsulotlar ({getTotalItems()})</span>
                  <div className={cn('flex', 'items-center', 'gap-1')}>
                    <Coins className={cn('w-4', 'h-4', 'text-[#F59E0B]')} />
                    <span className={cn('font-semibold', 'text-[#1A1D26]')}>
                      {getTotalCoins()}
                    </span>
                  </div>
                </div>

                <div className={cn('flex', 'justify-between', 'items-center', 'py-3', 'border-b', 'border-gray-100')}>
                  <span className={cn('text-gray-500', 'text-sm')}>Yetkazib berish</span>
                  <span className={cn('font-semibold', 'text-green-500')}>
                    Bepul
                  </span>
                </div>

                <div className={cn('flex', 'justify-between', 'items-center', 'py-3')}>
                  <span className={cn('font-bold', 'text-[#1A1D26]')}>Jami</span>
                  <div className={cn('flex', 'items-center', 'gap-1')}>
                    <Coins className={cn('w-5', 'h-5', 'text-[#F59E0B]')} />
                    <span className={cn('text-2xl', 'font-bold', 'text-[#1A1D26]')}>
                      {getTotalCoins()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className={cn('w-full', 'bg-[#2D6BFF]', 'text-white', 'px-6', 'py-4', 'rounded-2xl', 'font-semibold', 'flex', 'items-center', 'justify-center', 'gap-2', 'hover:bg-[#1A56E8]', 'transition-colors', 'shadow-lg', 'shadow-[#2D6BFF]/30')}
              >
                <Check className={cn('w-5', 'h-5')} />
                Sotib olish
              </button>

              <button
                onClick={() => navigate("/shop")}
                className={cn('w-full', 'mt-3', 'bg-gray-100', 'text-gray-600', 'px-6', 'py-3', 'rounded-2xl', 'font-medium', 'hover:bg-gray-200', 'transition-colors')}
              >
                Do'konni davom ettirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
