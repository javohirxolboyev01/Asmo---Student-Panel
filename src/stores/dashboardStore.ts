// src/stores/dashboardStore.ts
import { create } from "zustand";
import { DashboardData } from "@/types/notification";
import { dashboardService } from "@/services/dashboardService";

interface DashboardState {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await dashboardService.getDashboard();
      set({ data });
    } catch (error) {
      set({ error: "Failed to load dashboard" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
