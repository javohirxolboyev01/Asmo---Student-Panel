// src/pages/NotificationsPage.tsx
import { useNotificationStore } from "@/stores/notificationStore";
import { Bell, Check, Clock } from "lucide-react";
import { getRelativeTime } from "@/utilist/formatData";
import { cn } from "@/lib/utils";

export const NotificationsPage = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "homework":
        return "📝";
      case "lesson":
        return "📅";
      case "grade":
        return "⭐";
      default:
        return "🔔";
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1D26]">
            Xabarlar
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            {unreadCount > 0
              ? `${unreadCount} ta o'qilmagan`
              : "Barchasi o'qilgan"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-[#2D6BFF] font-medium flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            Hammasini o'qish
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[#1A1D26] mb-1">
            Xabarlar yo'q
          </h3>
          <p className="text-gray-500 text-sm">
            Hali hech qanday xabar kelmagan
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={cn(
                "card cursor-pointer hover:shadow-card-hover transition-all duration-200",
                !notification.isRead && "border-l-4 border-l-[#2D6BFF]",
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
                        <h4 className="font-semibold text-[#1A1D26]">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-[#2D6BFF] rounded-full flex-shrink-0 mt-1.5" />
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
