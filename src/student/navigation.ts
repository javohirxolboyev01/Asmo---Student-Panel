// src/student/navigation.ts
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Coins,
  Bell,
  User,
  ShoppingBag,
  CreditCard,
} from "lucide-react";
import type { PanelNavigation } from "@/components/Layout/navigation";

export const studentNavigation: PanelNavigation = {
  roleLabelKey: "nav.student",
  sidebar: [
    { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/" },
    { icon: BookOpen, labelKey: "nav.groups", path: "/groups" },
    { icon: Calendar, labelKey: "nav.attendance", path: "/attendance" },
    { icon: ShoppingBag, labelKey: "nav.shop", path: "/shop" },
    { icon: Coins, labelKey: "nav.coins", path: "/coins" },
    { icon: CreditCard, labelKey: "nav.payments", path: "/payments" },
    { icon: Bell, labelKey: "nav.notifications", path: "/notifications" },
    { icon: User, labelKey: "nav.profile", path: "/profile" },
  ],
  bottom: [
    { path: "/", icon: LayoutDashboard, labelKey: "nav.dashboardShort" },
    { path: "/groups", icon: BookOpen, labelKey: "nav.groupsShort" },
    { path: "/attendance", icon: Calendar, labelKey: "nav.attendance" },
    { path: "/shop", icon: ShoppingBag, labelKey: "nav.shop" },
    { path: "/coins", icon: Coins, labelKey: "nav.coins" },
    { path: "/payments", icon: CreditCard, labelKey: "nav.payments" },
  ],
};
