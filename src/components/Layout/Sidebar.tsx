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
      {/* Mobile overlay — faqat mobilда drawer ochiq bo'lsa */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)]
          bg-white border-r border-gray-100 z-40
          w-[260px] flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* User info */}
        {user && (
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar}
                  alt={user.firstName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-sm text-[#1A1D26]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-400">Talaba</p>
                </div>
              </div>
              {/* Close faqat mobilда ko'rinadi */}
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Yopish"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
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
                end={item.path === "/"}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "active" : ""}`
                }
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
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-sm font-semibold text-[#1A1D26]">
              Edu Center
            </span>
          </div>
          <p className="text-xs text-gray-400">v1.0 · © 2024</p>
        </div>
      </aside>
    </>
  );
};
