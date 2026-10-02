// src/components/Layout/Header.tsx
import { useEffect, useRef, useState } from "react";
import { User } from "@/types/user";
import { Bell } from "lucide-react";
import Logo from "@/images/logo.png";
import { Link } from "react-router-dom";
import { cn, getAvatarUrl } from "@/lib/utils";
import { useNotificationsQuery } from "@/hooks/queries/useNotifications";

interface HeaderProps {
  user: User | null;
}

export const Header = ({ user }: HeaderProps) => {
  const { data: notifications } = useNotificationsQuery();
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const [justBumped, setJustBumped] = useState(false);
  const previousCount = useRef(unreadCount);

  useEffect(() => {
    if (unreadCount > previousCount.current) {
      setJustBumped(true);
      const timeout = setTimeout(() => setJustBumped(false), 700);
      previousCount.current = unreadCount;
      return () => clearTimeout(timeout);
    }
    previousCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 z-40">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-[1400px] mx-auto">
        {/* Mobile: account (avatar + name) on the left instead of the logo */}
        {user && (
          <Link to="/profile" className="flex md:hidden items-center gap-2 min-w-0">
            <img
              src={getAvatarUrl(user.avatar, `${user.firstName} ${user.lastName}`)}
              alt={user.firstName}
              className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-gray-700 flex-shrink-0"
            />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {user.firstName} {user.lastName}
            </span>
          </Link>
        )}

        {/* Logo — desktop only */}
        <Link to="/" className="hidden md:flex items-center">
          <img
            src={Logo}
            alt="ASMO Learning Platform"
            className="w-[180px] md:w-[300px] h-auto object-contain md:-ml-12 text-warning dark:brightness-0 dark:invert"
          />
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          <Link
            to="/notifications"
            className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <Bell className={cn("w-5 h-5", justBumped && "animate-bell-ring")} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center">
                {justBumped && (
                  <span className="absolute inline-flex h-full w-full rounded-full bg-danger/60 animate-ping" />
                )}
                <span
                  key={unreadCount}
                  className={cn(
                    "relative min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center leading-none",
                    justBumped && "animate-badge-pop",
                  )}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              </span>
            )}
          </Link>

          {user && (
            <Link to="/profile" className="hidden md:flex items-center gap-2">
              <img
                src={getAvatarUrl(user.avatar, `${user.firstName} ${user.lastName}`)}
                alt={user.firstName}
                className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700 hover:border-warning transition-colors"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
