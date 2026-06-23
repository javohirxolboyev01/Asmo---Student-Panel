// src/services/dashboardService.ts
import api from "./api";

export const dashboardService = {
  getDashboard: async () => {
    const response = await api.get("/dashboard.json");
    return response.data;
  },
};
