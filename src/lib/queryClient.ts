// src/lib/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/services/apiClient";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) =>
        error instanceof ApiError && [401, 403, 404].includes(error.status)
          ? false
          : failureCount < 2,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Bitta joyda saqlangan query key'lar — query va uni invalidatsiya qiladigan
// mutation o'rtasida key satrlari mos kelmasligi (typo) xavfini yo'qotadi.
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  leaderboard: (filter: string) => ["dashboard", "leaderboard", filter] as const,
  groups: ["groups"] as const,
  groupDetail: (id: string) => ["groups", id] as const,
  directions: ["directions"] as const,
  teachers: ["teachers"] as const,
  students: (params?: { search?: string; groupId?: string }) =>
    ["students", params ?? {}] as const,
  studentDetail: (id: string) => ["students", "detail", id] as const,
  notifications: ["notifications"] as const,
  coins: ["coins"] as const,
  teacherCoinTransactions: ["coins", "teacher", "transactions"] as const,
  payments: ["payments"] as const,
  products: (params?: Record<string, unknown>) => ["products", params ?? {}] as const,
  wishlist: ["wishlist"] as const,
  lesson: (id: string) => ["lessons", id] as const,
  attendance: (groupId?: string | null) => ["attendance", groupId ?? null] as const,
  weeklyAttendance: (groupId: string, date?: string | null) =>
    ["attendance", "weekly", groupId, date ?? null] as const,
  pendingSubmissions: ["submissions", "pending"] as const,
  submissionDetail: (id: string) => ["submissions", id] as const,
};
