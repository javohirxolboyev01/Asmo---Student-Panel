// src/stores/groupStore.ts
import { create } from "zustand";
import { Group } from "@/types/group";
import { groupService } from "@/services/groupService";

interface GroupState {
  groups: Group[];
  selectedGroup: any;
  lessons: any[];
  isLoading: boolean;
  error: string | null;
  fetchGroups: () => Promise<void>;
  fetchGroupDetail: (_id: string) => Promise<void>;
  clearSelectedGroup: () => void;
}

export const useGroupStore = create<GroupState>((set) => ({
  groups: [],
  selectedGroup: null,
  lessons: [],
  isLoading: false,
  error: null,

  fetchGroups: async () => {
    set({ isLoading: true, error: null });
    try {
      const groups = await groupService.getGroups();
      set({ groups });
    } catch (error) {
      set({ error: "Failed to load groups" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchGroupDetail: async (_id: string) => {
    set({ isLoading: true, error: null });
    try {
      const data = await groupService.getGroupDetail();
      set({ selectedGroup: data.group, lessons: data.lessons });
    } catch (error) {
      set({ error: "Failed to load group details" });
    } finally {
      set({ isLoading: false });
    }
  },

  clearSelectedGroup: () => {
    set({ selectedGroup: null, lessons: [] });
  },
}));
