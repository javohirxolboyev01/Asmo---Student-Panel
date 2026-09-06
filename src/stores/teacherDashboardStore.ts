// src/stores/teacherDashboardStore.ts
import { create } from "zustand";
import { teacherService } from "@/services/teacherService";
import { TeacherDashboardData } from "@/types/teacher";

interface TeacherDashboardState {
  data: TeacherDashboardData | null;
  isLoading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
}

export const useTeacherDashboardStore = create<TeacherDashboardState>((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await teacherService.getDashboard();
      set({ data });
    } catch (error) {
      set({ error: "Failed to load dashboard" });
    } finally {
      set({ isLoading: false });
    }
  },
}));
