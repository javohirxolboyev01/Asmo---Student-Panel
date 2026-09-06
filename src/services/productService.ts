// src/services/productService.ts
import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  rating: number;
  reviews: number;
  isPopular?: boolean;
  isNew?: boolean;
  isLimited?: boolean;
}

export const productService = {
  getProducts: async (params?: { category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== "Hammasi") {
      query.set("category", params.category);
    }
    if (params?.search) {
      query.set("search", params.search);
    }
    const qs = query.toString();
    const data = await apiGet<Product[] | { products: Product[] }>(
      `/products${qs ? `?${qs}` : ""}`,
    );
    return Array.isArray(data) ? data : data.products ?? [];
  },

  createProduct: async (payload: Omit<Product, "id" | "rating" | "reviews">) =>
    apiPost<Product>("/products", payload),

  updateProduct: async (id: string, payload: Partial<Omit<Product, "id" | "rating" | "reviews">>) =>
    apiPatch<Product>(`/products/${id}`, payload),

  deleteProduct: async (id: string) => apiDelete(`/products/${id}`),
};
