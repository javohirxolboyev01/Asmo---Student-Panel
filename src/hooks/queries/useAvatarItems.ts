// src/hooks/queries/useAvatarItems.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { avatarService } from "@/services/avatarService";
import { queryKeys } from "@/lib/queryClient";

export const useAvatarItemsQuery = (enabled = true) =>
  useQuery({ queryKey: queryKeys.avatarItems, queryFn: avatarService.getItems, enabled });

export const usePurchaseAvatarItemMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: avatarService.purchase,
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.avatarItems, result);
      // Coins were spent → every balance shown in the app is stale.
      queryClient.invalidateQueries({ queryKey: queryKeys.coins });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.avatarItems }),
  });
};
