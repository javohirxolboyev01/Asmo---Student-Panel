// src/components/Layout/Sidebar.tsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Coins,
  Bell,
  User,
  X,
  GraduationCap,
} from "lucide-react";
import { SIDEBAR_ITEMS } from "@/constans/route";
import { useAuthStore } from "@/stores/authStore";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap = {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Coins,
  Bell,
  User,
};

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user } = useAuthStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full bg-card border-r border-gray-100 z-50
          transition-transform duration-300 ease-in-out
          w-[260px] flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-primary-500" />
            <span className="text-lg font-bold text-text-primary">
              Edu Center
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.firstName}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-text-primary">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-text-secondary">Talaba</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = iconMap[item.icon as keyof typeof iconMap];
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  sidebar-link ${isActive ? "active" : ""}
                `}
                onClick={() => {
                  if (window.innerWidth < 768) onClose();
                }}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100">
          <div className="text-xs text-text-secondary">
            <p>Edu Center v1.0</p>
            <p className="mt-0.5">© 2024 Edu Center</p>
          </div>
        </div>
      </aside>
    </>
  );
};
