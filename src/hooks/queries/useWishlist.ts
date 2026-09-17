// src/hooks/queries/useWishlist.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "@/services/wishlistService";
import { shopService } from "@/services/shopService";
import { toast } from "@/lib/toast";
import { translate } from "@/i18n/translate";
import { queryKeys } from "@/lib/queryClient";

export interface WishlistItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  quantity: number;
}

export const useWishlistQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.wishlist,
    queryFn: async () => {
      const wishlist = await wishlistService.getWishlist();
      return wishlist.map((product) => ({
        ...product,
        quantity: product.quantity ?? 1,
      })) as WishlistItem[];
    },
    enabled,
  });

// Backend faqat mahsulot savatda bor/yo'qligini (boolean) saqlaydi — miqdor
// sof frontend hisob-kitobi, shuning uchun miqdor o'zgarishlari (increment,
// decrement, updateQuantity) backendga so'rov yubormaydi; faqat qo'shish va
// olib tashlashda /wishlist chaqiriladi. Bu eski zustand store'dagi xatti-
// harakat bilan bir xil — endi shunchaki holat manbai react-query kesh.
export const useWishlistCart = (enabled = true) => {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useWishlistQuery(enabled);

  const setItems = (updater: (items: WishlistItem[]) => WishlistItem[]) => {
    queryClient.setQueryData<WishlistItem[]>(queryKeys.wishlist, (old) => updater(old ?? []));
  };

  const removeFromWishlist = (productId: string) => {
    setItems((current) => current.filter((item) => item.id !== productId));
    wishlistService.removeFromWishlist(productId).catch(() => {
      toast.error(translate("common.error"));
    });
  };

  const addToWishlist = (product: Omit<WishlistItem, "quantity">) => {
    const isNew = !items.some((item) => item.id === product.id);
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
    if (isNew) {
      wishlistService.addToWishlist(product.id).catch(() => {
        toast.error(translate("common.error"));
      });
    }
  };

  const decrementQuantity = (productId: string) => {
    const item = items.find((item) => item.id === productId);
    if (item && item.quantity > 1) {
      setItems((current) =>
        current.map((i) => (i.id === productId ? { ...i, quantity: i.quantity - 1 } : i)),
      );
      return;
    }
    removeFromWishlist(productId);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromWishlist(productId);
      return;
    }
    setItems((current) => current.map((i) => (i.id === productId ? { ...i, quantity } : i)));
  };

  const clearWishlist = () => setItems(() => []);

  const getTotalCoins = () => items.reduce((total, item) => total + item.price * item.quantity, 0);
  const getTotalItems = () => items.reduce((total, item) => total + item.quantity, 0);
  const getItemQuantity = (productId: string) =>
    items.find((item) => item.id === productId)?.quantity ?? 0;

  return {
    items,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    decrementQuantity,
    updateQuantity,
    clearWishlist,
    getTotalCoins,
    getTotalItems,
    getItemQuantity,
  };
};

export const useCheckoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: { productId: string; quantity: number }[]) => shopService.checkout(items),
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.wishlist, []);
      queryClient.invalidateQueries({ queryKey: queryKeys.coins });
    },
  });
};
