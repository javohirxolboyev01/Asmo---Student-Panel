// src/hooks/queries/useNotifications.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notificationService";
import { Notification } from "@/types/notification";
import { queryKeys } from "@/lib/queryClient";

const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

export const useNotificationsQuery = () =>
  useQuery({
    queryKey: queryKeys.notifications,
    queryFn: notificationService.getNotifications,
    refetchInterval: NOTIFICATION_POLL_INTERVAL_MS,
  });

const patchNotifications = (
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (notifications: Notification[]) => Notification[],
) => {
  const previous = queryClient.getQueryData<Notification[]>(queryKeys.notifications);
  queryClient.setQueryData<Notification[]>(queryKeys.notifications, (old) =>
    old ? updater(old) : old,
  );
  return previous;
};

export const useMarkNotificationAsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = patchNotifications(queryClient, (notifications) =>
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};

export const useMarkAllNotificationsAsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications });
      const previous = patchNotifications(queryClient, (notifications) =>
        notifications.map((n) => ({ ...n, isRead: true })),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
  });
};
