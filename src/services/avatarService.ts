// src/services/avatarService.ts — character editor shop (student).
import { apiGet, apiPost } from "./apiClient";

export interface AvatarItems {
  owned: string[];
  coinBalance: number;
}

export const avatarService = {
  getItems: () => apiGet<AvatarItems>("/avatar/items"),
  purchase: (key: string) => apiPost<AvatarItems>("/avatar/items/purchase", { key }),
};
