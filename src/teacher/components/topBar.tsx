// src/teacher/components/topBar.tsx
// Lets a page's PageHeader drive the shared top bar like UINavigationBar:
// the page's back button sits in the bar, and once the large title scrolls
// under the bar, a compact copy of it appears in the middle.
import { createContext, useContext, type ReactNode } from "react";

export interface TopBarState {
  title: ReactNode;
  back?: { to: string; label?: ReactNode };
  /** The large title has scrolled under the bar. */
  collapsed: boolean;
}

export interface TopBarApi {
  set: (state: TopBarState | null) => void;
}

export const TopBarContext = createContext<TopBarApi | null>(null);

export const useTopBar = () => useContext(TopBarContext);
