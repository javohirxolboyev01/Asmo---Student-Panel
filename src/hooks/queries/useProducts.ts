// src/hooks/queries/useProducts.ts
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { queryKeys } from "@/lib/queryClient";

export const productsQueryOptions = (params?: { category?: string; search?: string }) =>
  queryOptions({
    queryKey: queryKeys.products(params),
    queryFn: () => productService.getProducts(params),
  });

export const useProductsQuery = (params?: { category?: string; search?: string }) =>
  useQuery(productsQueryOptions(params));

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof productService.createProduct>[0]) =>
      productService.createProduct(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof productService.updateProduct>[1];
    }) => productService.updateProduct(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
};

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
};
