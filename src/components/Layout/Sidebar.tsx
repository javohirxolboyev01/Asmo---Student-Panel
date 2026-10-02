// src/components/Layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { getAvatarUrl } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import type { PanelNavigation } from "./navigation";

export const Sidebar = ({ navigation }: { navigation: PanelNavigation }) => {
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();

  return (
    <aside
      className="
        hidden md:flex fixed top-16 left-0 h-[calc(100vh-4rem)]
        bg-sidebar dark:bg-surface-dark border-r border-white/10 dark:border-gray-800 z-40
        w-[260px] flex-col
      "
    >
      {/* User info */}
      {user && (
        <div className="px-4 py-4 border-b border-white/10 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <img
              src={getAvatarUrl(user.avatar, `${user.firstName} ${user.lastName}`)}
              alt={user.firstName}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="font-medium text-sm text-white dark:text-gray-100">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-white/60 dark:text-gray-400">{t(navigation.roleLabelKey)}</p>
            </div>
          </div>
        </div>
      )}

        {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {navigation.sidebar.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{t(item.labelKey)}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};
