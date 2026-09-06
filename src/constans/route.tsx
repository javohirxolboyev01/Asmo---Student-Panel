// src/constants/routes.ts
export const ROUTES = {
  DASHBOARD: "/",
  GROUPS: "/groups",
  GROUP_DETAIL: "/groups/:id",
  LESSON_DETAIL: "/lessons/:id",
  ATTENDANCE: "/attendance",
  COINS: "/coins",
  NOTIFICATIONS: "/notifications",
  PROFILE: "/profile",
  PROFILE_EDIT: "/profile/edit",
  SETTINGS: "/settings",
  LOGIN: "/login",
  REGISTER: "/register",
} as const;

export const SIDEBAR_ITEMS = [
  { icon: "LayoutDashboard", labelKey: "nav.dashboard", path: ROUTES.DASHBOARD },
  { icon: "BookOpen", labelKey: "nav.groups", path: ROUTES.GROUPS },
  { icon: "Calendar", labelKey: "nav.attendance", path: ROUTES.ATTENDANCE },
  { icon: "ShoppingBag", labelKey: "nav.shop", path: "/shop" },
  { icon: "Coins", labelKey: "nav.coins", path: ROUTES.COINS },
  { icon: "CreditCard", labelKey: "nav.payments", path: "/payments" },
  { icon: "Bell", labelKey: "nav.notifications", path: ROUTES.NOTIFICATIONS },
  { icon: "User", labelKey: "nav.profile", path: ROUTES.PROFILE },
];

export const TEACHER_SIDEBAR_ITEMS = [
  { icon: "LayoutDashboard", labelKey: "nav.dashboard", path: ROUTES.DASHBOARD },
  { icon: "BookOpen", labelKey: "nav.groups", path: ROUTES.GROUPS },
  { icon: "Users", labelKey: "nav.students", path: "/students" },
  { icon: "GraduationCap", labelKey: "nav.teachers", path: "/teachers" },
  { icon: "ClipboardCheck", labelKey: "nav.grading", path: "/grading" },
  { icon: "Calendar", labelKey: "nav.attendance", path: ROUTES.ATTENDANCE },
  { icon: "Coins", labelKey: "nav.coins", path: ROUTES.COINS },
  { icon: "ShoppingBag", labelKey: "nav.shop", path: "/shop" },
  { icon: "CreditCard", labelKey: "nav.payments", path: "/payments" },
  { icon: "Bell", labelKey: "nav.notifications", path: ROUTES.NOTIFICATIONS },
  { icon: "User", labelKey: "nav.profile", path: ROUTES.PROFILE },
];
