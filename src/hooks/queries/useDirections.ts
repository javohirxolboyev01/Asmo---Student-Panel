// src/hooks/queries/useDirections.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";

export const useDirectionsQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.directions,
    queryFn: teacherService.getDirections,
    enabled,
  });

export const useCreateDirectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof teacherService.createDirection>[0]) =>
      teacherService.createDirection(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.directions }),
  });
};

export const useDeleteDirectionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherService.deleteDirection(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.directions }),
  });
};
