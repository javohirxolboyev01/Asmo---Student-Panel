// src/hooks/queries/useCoins.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coinService } from "@/services/coinService";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";

export const useCoinsQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.coins,
    queryFn: coinService.getCoins,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    enabled,
  });

export const useTeacherCoinTransactionsQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.teacherCoinTransactions,
    queryFn: teacherService.getTeacherCoins,
    enabled,
  });

export const useAwardCoinsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      studentId,
      amount,
      reason,
    }: {
      studentId: string;
      amount: number;
      reason: string;
    }) => teacherService.awardCoins(studentId, { amount, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherCoinTransactions });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.coins });
    },
  });
};
