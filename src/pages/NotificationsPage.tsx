// src/pages/NotificationsPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "@/stores/notificationStore";
import { Notification } from "@/types/notification";
import { Bell, Check, Clock } from "lucide-react";
import { getRelativeTime } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { SkeletonHeader, SkeletonCardGrid } from "@/components/common/Skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui";

// Backend "submission" xabarnomasida qaysi topshiriqqa tegishli ekanini
// turli nom bilan yuborishi mumkin — hammasini sinab ko'ramiz.
const getSubmissionId = (n: Notification): string | undefined => {
  const candidate = n.submissionId ?? n.relatedId ?? n.entityId ?? n.targetId;
  return typeof candidate === "string" ? candidate : undefined;
};

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const notifications = useNotificationStore((state) => state.notifications);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.type === "submission") {
      const submissionId = getSubmissionId(notification);
      navigate(submissionId ? `/submissions/${submissionId}` : "/grading");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (isLoading && notifications.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <SkeletonCardGrid count={4} cols="grid-cols-1 lg:grid-cols-2" />
      </div>
    );
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "homework":
        return "📝";
      case "lesson":
        return "📅";
      case "grade":
        return "⭐";
      case "submission":
        return "📩";
      default:
        return "🔔";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
            {t("notifications.title")}
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            {unreadCount > 0
              ? t("notifications.unreadCount", { count: unreadCount })
              : t("notifications.allRead")}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllAsRead}
            leftIcon={<Check className="w-4 h-4" />}
          >
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
            {t("notifications.empty")}
          </h3>
          <p className="text-gray-500 text-sm">
            {t("notifications.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleOpen(notification)}
              className={cn(
                "card cursor-pointer hover:shadow-card-hover transition-all duration-200",
                !notification.isRead && "border-l-4 border-l-warning",
              )}
            >
              <div className="p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-warning rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{getRelativeTime(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
