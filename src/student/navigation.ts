// src/student/navigation.ts
// Student panel menu ("Kosmik maktab" theme). The same list drives the
// floating bottom bar on mobile and the left rail on desktop; profile and
// notifications are reached from the HUD (avatar / bell) instead.
import {
  CalendarDays,
  CreditCard,
  Gem,
  House,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface StudentNavItem {
  path: string;
  icon: LucideIcon;
  labelKey: string;
}

export const studentNavigation: StudentNavItem[] = [
  { path: "/", icon: House, labelKey: "nav.dashboardShort" },
  { path: "/groups", icon: Users, labelKey: "nav.groupsShort" },
  { path: "/attendance", icon: CalendarDays, labelKey: "nav.attendance" },
  { path: "/shop", icon: ShoppingCart, labelKey: "nav.shop" },
  { path: "/coins", icon: Gem, labelKey: "nav.coins" },
  { path: "/payments", icon: CreditCard, labelKey: "nav.payments" },
];
