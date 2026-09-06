// src/services/wishlistService.ts
import { apiGet, apiPost, apiDelete } from "./apiClient";

interface WishlistProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  quantity?: number;
}

export const wishlistService = {
  getWishlist: async () => {
    const data = await apiGet<WishlistProduct[] | { wishlist: WishlistProduct[] }>("/wishlist");
    return Array.isArray(data) ? data : data.wishlist ?? [];
  },
  addToWishlist: async (productId: string) => {
    return apiPost(`/wishlist/${productId}`);
  },
  removeFromWishlist: async (productId: string) => {
    return apiDelete(`/wishlist/${productId}`);
  },
};
