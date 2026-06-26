// src/stores/dashboardStore.ts
import { create } from "zustand";
import { DashboardData } from "@/types/notification";
import { dashboardService } from "@/services/dashboardService";
import {
  LeaderboardFilter,
  LeaderboardStudent,
} from "@/components/Dashboard/CoinLeaderboard";

// ─── Mock default students (backend tayyor bo'lgunga qadar) ──────────────────
const DEFAULT_STUDENTS: Record<LeaderboardFilter, LeaderboardStudent[]> = {
  week: [
    {
      id: 1,
      name: "Zulfiya Nazarova",
      group: "Pre-Intermediate A",
      coins: 340,
      streak: 12,
      avatar: "ZN",
    },
    {
      id: 2,
      name: "Bobur Toshmatov",
      group: "Intermediate B",
      coins: 295,
      streak: 9,
      avatar: "BT",
    },
    {
      id: 3,
      name: "Malika Rahimova",
      group: "Elementary C",
      coins: 271,
      streak: 7,
      avatar: "MR",
    },
    {
      id: 4,
      name: "Jasur Karimov",
      group: "Pre-Intermediate A",
      coins: 244,
      streak: 5,
      avatar: "JK",
    },
    {
      id: 5,
      name: "Sarvinoz Umarova",
      group: "Intermediate B",
      coins: 218,
      streak: 4,
      avatar: "SU",
    },
    {
      id: 6,
      name: "Otabek Mirzayev",
      group: "Beginner A",
      coins: 196,
      streak: 3,
      avatar: "MO",
    },
    {
      id: 7,
      name: "Dilnoza Yusupova",
      group: "Pre-Intermediate A",
      coins: 174,
      streak: 2,
      avatar: "DY",
    },
  ],
  month: [
    {
      id: 2,
      name: "Bobur Toshmatov",
      group: "Intermediate B",
      coins: 1240,
      streak: 28,
      avatar: "BT",
    },
    {
      id: 1,
      name: "Zulfiya Nazarova",
      group: "Pre-Intermediate A",
      coins: 1190,
      streak: 25,
      avatar: "ZN",
    },
    {
      id: 4,
      name: "Jasur Karimov",
      group: "Pre-Intermediate A",
      coins: 980,
      streak: 20,
      avatar: "JK",
    },
    {
      id: 3,
      name: "Malika Rahimova",
      group: "Elementary C",
      coins: 870,
      streak: 14,
      avatar: "MR",
    },
    {
      id: 5,
      name: "Sarvinoz Umarova",
      group: "Intermediate B",
      coins: 740,
      streak: 12,
      avatar: "SU",
    },
    {
      id: 6,
      name: "Otabek Mirzayev",
      group: "Beginner A",
      coins: 620,
      streak: 8,
      avatar: "OM",
    },
    {
      id: 7,
      name: "Dilnoza Yusupova",
      group: "Pre-Intermediate A",
      coins: 510,
      streak: 6,
      avatar: "DY",
    },
  ],
  all: [
    {
      id: 2,
      name: "Bobur Toshmatov",
      group: "Intermediate B",
      coins: 4850,
      streak: 60,
      avatar: "BT",
    },
    {
      id: 3,
      name: "Malika Rahimova",
      group: "Elementary C",
      coins: 4320,
      streak: 45,
      avatar: "MR",
    },
    {
      id: 1,
      name: "Zulfiya Nazarova",
      group: "Pre-Intermediate A",
      coins: 3970,
      streak: 40,
      avatar: "ZN",
    },
    {
      id: 4,
      name: "Jasur Karimov",
      group: "Pre-Intermediate A",
      coins: 3210,
      streak: 35,
      avatar: "JK",
    },
    {
      id: 5,
      name: "Sarvinoz Umarova",
      group: "Intermediate B",
      coins: 2800,
      streak: 28,
      avatar: "SU",
    },
    {
      id: 6,
      name: "Otabek Mirzayev",
      group: "Beginner A",
      coins: 2100,
      streak: 20,
      avatar: "OM",
    },
    {
      id: 7,
      name: "Dilnoza Yusupova",
      group: "Pre-Intermediate A",
      coins: 1750,
      streak: 15,
      avatar: "DY",
    },
  ],
};

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
    students: DEFAULT_STUDENTS.week,
    currentUserRank: 7,
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
          students: result.students ?? DEFAULT_STUDENTS[filter],
          currentUserRank: result.currentUserRank,
          isLeaderboardLoading: false,
        },
      }));
    } catch {
      // Fetch xato bo'lsa mock data ko'rsatiladi
      set((s) => ({
        leaderboard: {
          ...s.leaderboard,
          students: DEFAULT_STUDENTS[filter],
          currentUserRank: 7,
          isLeaderboardLoading: false,
        },
      }));
    }
  },

  setLeaderboardFilter: (filter: LeaderboardFilter) => {
    get().fetchLeaderboard(filter);
  },
}));
