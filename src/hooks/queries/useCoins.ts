// src/hooks/queries/useCoins.ts
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { coinService } from "@/services/coinService";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";

export const coinsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.coins,
    queryFn: coinService.getCoins,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });

export const useCoinsQuery = (enabled = true) => useQuery({ ...coinsQueryOptions(), enabled });

export const teacherCoinTransactionsQueryOptions = () =>
  queryOptions({
    queryKey: queryKeys.teacherCoinTransactions,
    queryFn: teacherService.getTeacherCoins,
  });

export const useTeacherCoinTransactionsQuery = (enabled = true) =>
  useQuery({ ...teacherCoinTransactionsQueryOptions(), enabled });

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
