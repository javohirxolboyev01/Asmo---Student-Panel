// src/services/dashboardService.ts
import { apiGet } from "./apiClient";
import { DashboardData } from "@/types/notification";
import { LeaderboardFilter, LeaderboardStudent } from "@/components/Dashboard/CoinLeaderboard";

interface RawLeaderboardEntry {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  balance: number;
}

const initials = (firstName: string, lastName: string) =>
  `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

export const dashboardService = {
  getDashboard: async () => {
    return apiGet<DashboardData>("/dashboard");
  },

  getLeaderboard: async (filter: LeaderboardFilter = "week") => {
    const data = await apiGet<
      RawLeaderboardEntry[] | { students: RawLeaderboardEntry[]; currentUserRank?: number }
    >(`/leaderboard?filter=${filter}`);

    const rawStudents = Array.isArray(data) ? data : data.students ?? [];
    const students: LeaderboardStudent[] = rawStudents.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim(),
      coins: s.balance,
      avatar: s.avatar || initials(s.firstName, s.lastName),
    }));

    return {
      students,
      currentUserRank: Array.isArray(data) ? undefined : data.currentUserRank,
    };
  },
};
