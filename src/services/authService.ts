// src/services/authService.ts
import api from "./api";

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.get("/auth.json");
    return response.data;
  },
  getMe: async () => {
    const response = await api.get("/auth.json");
    return response.data.user;
  },
  logout: () => {
    localStorage.removeItem("token");
  },
};
