// src/stores/dashboardStore.ts
import { create } from "zustand";
import { DashboardData } from "@/types/notification";
import { dashboardService } from "@/services/dashboardService";
import {
  LeaderboardFilter,
  LeaderboardStudent,
} from "@/components/Dashboard/CoinLeaderboard";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardState {
  students: LeaderboardStudent[];
  currentUserRank: number | undefined;
  filter: LeaderboardFilter;
  isLeaderboardLoading: boolean;
}

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  leaderboard: LeaderboardState;
  fetchDashboard: () => Promise<void>;
  fetchLeaderboard: (filter: LeaderboardFilter) => Promise<void>;
  setLeaderboardFilter: (filter: LeaderboardFilter) => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useDashboardStore = create<DashboardState>((set, get) => ({
  data: null,
  isLoading: false,
  error: null,

  leaderboard: {
    students: [],
    currentUserRank: undefined,
    filter: "week",
    isLeaderboardLoading: false,
  },

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await dashboardService.getDashboard();
      set({ data });
    } catch {
      set({ error: "Failed to load dashboard" });
    } finally {
      set({ isLoading: false });
    }
    // Dashboard bilan birga leaderboard ham yuklanadi
    get().fetchLeaderboard(get().leaderboard.filter);
  },

  fetchLeaderboard: async (filter: LeaderboardFilter) => {
    set((s) => ({
      leaderboard: { ...s.leaderboard, isLeaderboardLoading: true, filter },
    }));
    try {
      const result = await dashboardService.getLeaderboard(filter);
      set((s) => ({
        leaderboard: {
          ...s.leaderboard,
          students: result.students,
          currentUserRank: result.currentUserRank,
          isLeaderboardLoading: false,
        },
      }));
    } catch {
      set((s) => ({
        leaderboard: { ...s.leaderboard, isLeaderboardLoading: false },
      }));
    }
  },

  setLeaderboardFilter: (filter: LeaderboardFilter) => {
    get().fetchLeaderboard(filter);
  },
}));
