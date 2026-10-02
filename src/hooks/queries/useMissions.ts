// src/hooks/queries/useMissions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { missionService } from "@/services/missionService";
import { queryKeys } from "@/lib/queryClient";
import type { MissionInput, MissionsToday } from "@/types/mission";

// ── Student ──

export const useMissionsTodayQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.missionsToday,
    queryFn: missionService.getToday,
    staleTime: 15_000,
    // A mission can become claimable after the student submits homework in
    // another tab / a teacher grades it, so re-check when they come back.
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

export const useClaimMissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: missionService.claim,
    onSuccess: (result) => {
      queryClient.setQueryData<MissionsToday>(queryKeys.missionsToday, (old) =>
        old && {
          ...old,
          streak: result.streak,
          completed: old.completed + 1,
          missions: old.missions.map((m) => (m.id === result.missionId ? { ...m, status: "CLAIMED" } : m)),
        },
      );
      invalidateCoinViews(queryClient);
      // A claimable attendance/homework mission means that data changed too.
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.missionsToday }),
  });
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

// ── Staff ──

export const useMissionsQuery = () =>
  useQuery({ queryKey: queryKeys.missions, queryFn: missionService.list });

const useMissionMutation = <TArgs,>(fn: (args: TArgs) => Promise<unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["missions"] }),
  });
};

export const useCreateMissionMutation = () =>
  useMissionMutation((input: MissionInput) => missionService.create(input));

export const useUpdateMissionMutation = () =>
  useMissionMutation(({ id, input }: { id: string; input: MissionInput }) => missionService.update(id, input));

export const useDeleteMissionMutation = () => useMissionMutation((id: string) => missionService.remove(id));
