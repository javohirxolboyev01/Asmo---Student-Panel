// src/components/Layout/BottomNav.tsx
import { NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, Calendar, Coins, Bell } from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Bosh" },
  { path: "/groups", icon: BookOpen, label: "Guruh" },
  { path: "/attendance", icon: Calendar, label: "Davomat" },
  { path: "/coins", icon: Coins, label: "Coin" },
  { path: "/notifications", icon: Bell, label: "Xabar" },
];

export const BottomNav = () => {
  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `bottom-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
