// src/services/missionService.ts — daily gift (chest) + streak.
// Missions themselves are no longer used by the UI.
import { apiGet, apiPost } from "./apiClient";
import type { MissionsToday, OpenChestResult } from "@/types/mission";

export const missionService = {
  getToday: () => apiGet<MissionsToday>("/missions/today"),
  openChest: (pick: number) => apiPost<OpenChestResult>("/chest/open", { pick }),
};
