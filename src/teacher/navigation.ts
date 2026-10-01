// src/teacher/navigation.ts
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Coins,
  Bell,
  User,
  GraduationCap,
  Users,
  ShoppingBag,
  CreditCard,
  ClipboardCheck,
} from "lucide-react";
import type { PanelNavigation } from "@/components/Layout/navigation";

export const teacherNavigation: PanelNavigation = {
  roleLabelKey: "nav.teacher",
  sidebar: [
    { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/" },
    { icon: BookOpen, labelKey: "nav.groups", path: "/groups" },
    { icon: Users, labelKey: "nav.students", path: "/students" },
    { icon: GraduationCap, labelKey: "nav.teachers", path: "/teachers" },
    { icon: ClipboardCheck, labelKey: "nav.grading", path: "/grading" },
    { icon: Calendar, labelKey: "nav.attendance", path: "/attendance" },
    { icon: Coins, labelKey: "nav.coins", path: "/coins" },
    { icon: ShoppingBag, labelKey: "nav.shop", path: "/shop" },
    { icon: CreditCard, labelKey: "nav.payments", path: "/payments" },
    { icon: Bell, labelKey: "nav.notifications", path: "/notifications" },
    { icon: User, labelKey: "nav.profile", path: "/profile" },
  ],
  bottom: [
    { path: "/", icon: LayoutDashboard, labelKey: "nav.dashboardShort" },
    { path: "/groups", icon: BookOpen, labelKey: "nav.groupsShort" },
    { path: "/grading", icon: ClipboardCheck, labelKey: "nav.grading" },
    { path: "/students", icon: Users, labelKey: "nav.students" },
    { path: "/coins", icon: Coins, labelKey: "nav.coins" },
    { path: "/payments", icon: CreditCard, labelKey: "nav.payments" },
  ],
};
