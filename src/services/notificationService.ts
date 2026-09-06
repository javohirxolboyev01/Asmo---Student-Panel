// src/services/notificationService.ts
import { apiGet, apiPatch } from "./apiClient";
import { Notification } from "@/types/notification";

export const notificationService = {
  getNotifications: async () => {
    const data = await apiGet<Notification[] | { notifications: Notification[] }>(
      "/notifications",
    );
    return Array.isArray(data) ? data : data.notifications ?? [];
  },
  markAsRead: async (id: string) => {
    return apiPatch(`/notifications/${id}/read`);
  },
  markAllAsRead: async () => {
    return apiPatch("/notifications/read-all");
  },
};
