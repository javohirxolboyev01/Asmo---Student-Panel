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
  LOGIN: "/login",
} as const;

export const SIDEBAR_ITEMS = [
  { icon: "LayoutDashboard", label: "Bosh sahifa", path: ROUTES.DASHBOARD },
  { icon: "BookOpen", label: "Guruhlar", path: ROUTES.GROUPS },
  { icon: "Calendar", label: "Davomat", path: ROUTES.ATTENDANCE },
  { icon: "Coins", label: "Coin", path: ROUTES.COINS },
  { icon: "Bell", label: "Xabarlar", path: ROUTES.NOTIFICATIONS },
  { icon: "User", label: "Profil", path: ROUTES.PROFILE },
];
