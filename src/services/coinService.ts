// src/services/coinService.ts
import api from "./api";

export const coinService = {
  getCoins: async () => {
    const response = await api.get("/coins.json");
    return response.data;
  },
};
