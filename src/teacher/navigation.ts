// src/teacher/navigation.ts
// "Ustoz paneli" menu (mock: Bosh, Guruh, Baholash, Talabalar, Coin, Ko'proq).
// Phones show exactly those six in the bottom bar; the desktop rail also lists
// tests, missions and payments directly, since there is room. Everything else
// (attendance, shop, teachers, notifications, profile, settings) lives on the
// "Ko'proq" page.
import {
  BookOpen,
  ClipboardCheck,
  Coins,
  CreditCard,
  House,
  ListChecks,
  Menu,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface TeacherNavItem {
  path: string;
  icon: LucideIcon;
  labelKey: string;
  /** Other routes that light this item up (nested pages). */
  match?: string[];
}

const more: TeacherNavItem = {
  path: "/more",
  icon: Menu,
  labelKey: "nav.more",
  match: ["/profile", "/settings", "/notifications", "/attendance", "/shop", "/teachers"],
};

export const teacherMainNav: TeacherNavItem[] = [
  { path: "/", icon: House, labelKey: "nav.dashboardShort" },
  { path: "/groups", icon: BookOpen, labelKey: "nav.groupsShort", match: ["/lessons"] },
  { path: "/grading", icon: ClipboardCheck, labelKey: "nav.grading", match: ["/submissions"] },
  { path: "/students", icon: Users, labelKey: "nav.students" },
  { path: "/coins", icon: Coins, labelKey: "nav.coins" },
];

/** Desktop-only rail entries; on phones they are reached from "Ko'proq". */
export const teacherExtraNav: TeacherNavItem[] = [
  { path: "/tests", icon: ListChecks, labelKey: "nav.tests" },
  { path: "/missions", icon: Target, labelKey: "nav.missions" },
  { path: "/payments", icon: CreditCard, labelKey: "nav.payments" },
];

export const teacherMoreNav = more;

const under = (pathname: string, path: string) =>
  path === "/" ? pathname === "/" : pathname === path || pathname.startsWith(`${path}/`);

export const isNavActive = (item: TeacherNavItem, pathname: string) =>
  under(pathname, item.path) || (item.match ?? []).some((path) => under(pathname, path));

/** Phones: tests/missions/payments pages light up "Ko'proq". */
export const isMoreActiveOnMobile = (pathname: string) =>
  isNavActive(more, pathname) || teacherExtraNav.some((item) => isNavActive(item, pathname));
