// src/components/Layout/navigation.ts
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  labelKey: string;
}

// Menu of one panel (student or teacher), consumed by the shared Layout.
export interface PanelNavigation {
  /** Caption under the user's name in the desktop sidebar. */
  roleLabelKey: string;
  /** Desktop sidebar links. */
  sidebar: NavItem[];
  /** Mobile bottom tab bar links. */
  bottom: NavItem[];
  /** Mobile "More" sheet: pages that don't fit in the tab bar (else unreachable on phones). */
  more?: NavItem[];
}
