// src/hooks/queries/useDashboard.ts
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboardService";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";
import type { LeaderboardFilter } from "@/components/Dashboard/CoinLeaderboard";

export const useDashboardQuery = () =>
  useQuery({ queryKey: queryKeys.dashboard, queryFn: dashboardService.getDashboard });

export const useTeacherDashboardQuery = () =>
  useQuery({ queryKey: queryKeys.dashboard, queryFn: teacherService.getDashboard });

export const useLeaderboardQuery = (filter: LeaderboardFilter) =>
  useQuery({
    queryKey: queryKeys.leaderboard(filter),
    queryFn: () => dashboardService.getLeaderboard(filter),
    // Switching week/month/all keeps the old list up until the new one arrives.
    placeholderData: keepPreviousData,
  });
