// src/services/missionService.ts
import { apiDelete, apiGet, apiPatch, apiPost } from "./apiClient";
import type {
  ClaimMissionResult,
  Mission,
  MissionInput,
  MissionsToday,
  OpenChestResult,
} from "@/types/mission";

export const missionService = {
  // student
  getToday: () => apiGet<MissionsToday>("/missions/today"),
  claim: (id: string) => apiPost<ClaimMissionResult>(`/missions/${id}/claim`, {}),
  openChest: (pick: number) => apiPost<OpenChestResult>("/chest/open", { pick }),

  // staff
  list: () => apiGet<Mission[]>("/missions"),
  create: (input: MissionInput) => apiPost<Mission>("/missions", input),
  update: (id: string, input: MissionInput) => apiPatch<Mission>(`/missions/${id}`, input),
  remove: (id: string) => apiDelete<void>(`/missions/${id}`),
};
