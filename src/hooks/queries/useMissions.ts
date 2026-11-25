// src/hooks/queries/useMissions.ts
// Missions are gone from the UI (tests pay coins themselves); only the daily
// gift (chest) and the streak still come from /missions/today.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { missionService } from "@/services/missionService";
import { queryKeys } from "@/lib/queryClient";
import type { MissionsToday } from "@/types/mission";

export const useMissionsTodayQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.missionsToday,
    queryFn: missionService.getToday,
    staleTime: 15_000,
    // A new day = a new chest; re-check when the student comes back.
    refetchOnWindowFocus: true,
    enabled,
  });

/** Coins changed → every balance shown in the app is stale. */
const invalidateCoinViews = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: queryKeys.coins });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  // The character editor shows the balance too (Buy buttons depend on it).
  queryClient.invalidateQueries({ queryKey: queryKeys.avatarItems });
};

export const useOpenChestMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: missionService.openChest,
    onSuccess: (result) => {
      queryClient.setQueryData<MissionsToday>(queryKeys.missionsToday, (old) =>
        old && { ...old, streak: result.streak, chest: { opened: true, reward: result.reward } },
      );
      invalidateCoinViews(queryClient);
    },
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.missionsToday }),
  });
};
