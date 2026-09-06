// src/services/shopService.ts
import { apiPost } from "./apiClient";

interface CheckoutItem {
  productId: string;
  quantity: number;
}

export const shopService = {
  checkout: async (items: CheckoutItem[]) => {
    return apiPost("/shop/checkout", { items });
  },
};
