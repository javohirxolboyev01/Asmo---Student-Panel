// src/stores/notificationStore.ts
import { create } from "zustand";
import { Notification } from "@/types/notification";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications) => {
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  },

  markAsRead: (id) => {
    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      return {
        notifications: updated,
        unreadCount: updated.filter((n) => !n.isRead).length,
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
