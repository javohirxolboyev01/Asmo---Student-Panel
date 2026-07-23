// src/stores/wishlistStore.ts
import { create } from "zustand";

interface WishlistItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  quantity: number;
}

interface WishlistState {
  items: WishlistItem[];
  addToWishlist: (product: Omit<WishlistItem, 'quantity'>) => void;
  removeFromWishlist: (productId: string) => void;
  decrementQuantity: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearWishlist: () => void;
  getTotalCoins: () => number;
  getTotalItems: () => number;
  getItemQuantity: (productId: string) => number;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],

  addToWishlist: (product) => {
    set((state) => {
      const existingItem = state.items.find((item) => item.id === product.id);
      if (existingItem) {
        return {
          items: state.items.map((item) =>
            item.id === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      return {
        items: [...state.items, { ...product, quantity: 1 }],
      };
    });
  },

  removeFromWishlist: (productId) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== productId),
    }));
  },

  decrementQuantity: (productId) => {
    set((state) => {
      const item = state.items.find((item) => item.id === productId);
      if (item && item.quantity > 1) {
        return {
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
          ),
        };
      }
      return {
        items: state.items.filter((item) => item.id !== productId),
      };
    });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromWishlist(productId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      ),
    }));
  },

  clearWishlist: () => {
    set({ items: [] });
  },

  getTotalCoins: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getItemQuantity: (productId) => {
    const item = get().items.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  },
}));
