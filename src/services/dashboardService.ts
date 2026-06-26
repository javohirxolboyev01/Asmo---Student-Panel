// src/services/dashboardService.ts
import api from "./api";
import { LeaderboardFilter } from "@/components/Dashboard/CoinLeaderboard";

export const dashboardService = {
  getDashboard: async () => {
    const response = await api.get("/dashboard.json");
    return response.data;
  },

  getLeaderboard: async (filter: LeaderboardFilter = "week") => {
    const response = await api.get(`/leaderboard.json?period=${filter}`);
    return response.data;
  },
};
