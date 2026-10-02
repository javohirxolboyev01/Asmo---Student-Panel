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
  Target,
  ListChecks,
} from "lucide-react";
import type { NavItem } from "@/components/Layout/navigation";
import type { PanelNavigation } from "@/components/Layout/navigation";

const sidebar: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "nav.dashboard", path: "/" },
  { icon: BookOpen, labelKey: "nav.groups", path: "/groups" },
  { icon: Users, labelKey: "nav.students", path: "/students" },
  { icon: GraduationCap, labelKey: "nav.teachers", path: "/teachers" },
  { icon: ClipboardCheck, labelKey: "nav.grading", path: "/grading" },
  { icon: Calendar, labelKey: "nav.attendance", path: "/attendance" },
  { icon: Coins, labelKey: "nav.coins", path: "/coins" },
  { icon: Target, labelKey: "nav.missions", path: "/missions" },
  { icon: ListChecks, labelKey: "nav.tests", path: "/tests" },
  { icon: ShoppingBag, labelKey: "nav.shop", path: "/shop" },
  { icon: CreditCard, labelKey: "nav.payments", path: "/payments" },
  { icon: Bell, labelKey: "nav.notifications", path: "/notifications" },
  { icon: User, labelKey: "nav.profile", path: "/profile" },
];

const bottom: NavItem[] = [
  { path: "/", icon: LayoutDashboard, labelKey: "nav.dashboardShort" },
  { path: "/groups", icon: BookOpen, labelKey: "nav.groupsShort" },
  { path: "/grading", icon: ClipboardCheck, labelKey: "nav.grading" },
  { path: "/students", icon: Users, labelKey: "nav.students" },
  { path: "/coins", icon: Coins, labelKey: "nav.coins" },
];

// The mobile header already links profile and notifications.
const IN_HEADER = new Set(["/profile", "/notifications"]);

export const teacherNavigation: PanelNavigation = {
  roleLabelKey: "nav.teacher",
  sidebar,
  bottom,
  more: sidebar.filter((item) => !IN_HEADER.has(item.path) && !bottom.some((b) => b.path === item.path)),
};
