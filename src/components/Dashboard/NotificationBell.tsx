// src/components/Dashboard/NotificationBell.tsx
import { Bell, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Notification } from "@/types/notification";
import { getRelativeTime } from "@/utilist/formatData";

interface NotificationBellProps {
  notifications: Notification[];
}

export const NotificationBell = ({ notifications }: NotificationBellProps) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recent = notifications.slice(0, 3);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-5 h-5 text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <h4 className="font-medium text-text-primary">Xabarlar</h4>
        </div>
        <Link
          to="/notifications"
          className="text-sm text-primary-500 hover:text-primary-600"
        >
          Ko'rish
        </Link>
      </div>

      <div className="space-y-3">
        {recent.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 rounded-xl ${!notification.isRead ? "bg-blue-50/50" : "bg-gray-50/50"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  {notification.title}
                </p>
                <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              {!notification.isRead && (
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              {getRelativeTime(notification.createdAt)}
            </p>
          </div>
        ))}
        {recent.length === 0 && (
          <p className="text-text-secondary text-sm text-center py-4">
            Yangi xabarlar yo'q
          </p>
        )}
      </div>
    </div>
  );
};
