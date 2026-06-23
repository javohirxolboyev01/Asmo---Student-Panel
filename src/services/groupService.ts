// src/services/groupService.ts
import api from "./api";

export const groupService = {
  getGroups: async () => {
    const response = await api.get("/groups.json");
    return response.data.groups;
  },
  getGroupDetail: async (id: string) => {
    const response = await api.get("/group-detail.json");
    return response.data;
  },
};
