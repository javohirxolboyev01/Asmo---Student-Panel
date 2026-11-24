// src/student/layout/StudentLayout.tsx
// App shell of the student panel ("Iliq" warm theme): top bar with avatar, coin /
// streak capsules and the bell; one nav that is a floating glass tab bar on
// mobile and a sidebar on desktop (pure CSS, see space.css); iOS push/pop
// transitions between pages. The teacher panel keeps the shared
// components/Layout.
import "../theme/space.css";
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Bell, Flame, GraduationCap, WifiOff } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import { CoinGlyph } from "../components/icons";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTrackNavigationHistory } from "@/hooks/useNavigationHistory";
import { useDashboardQuery } from "@/hooks/queries/useDashboard";
import { useNotificationsQuery } from "@/hooks/queries/useNotifications";
import { useMissionsTodayQuery } from "@/hooks/queries/useMissions";
import { SpaceAvatar } from "../components/SpaceAvatar";
import { EmptyState, PageSkeleton, SpaceErrorBoundary } from "../components/ui";
import {
  getGroupCourseName,
  getLevelFromCourse,
  getLevelNumber,
} from "../lib/level";
import { studentNavigation } from "../navigation";

/** Re-triggers the "pop" animation whenever `value` grows. */
const usePopOnIncrease = (value: number) => {
  const [popKey, setPopKey] = useState(0);
  const previous = useRef(value);
  useEffect(() => {
    if (value > previous.current) setPopKey((k) => k + 1);
    previous.current = value;
  }, [value]);
  return popKey;
};

const Hud = () => {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const { data } = useDashboardQuery();
  const { data: missions } = useMissionsTodayQuery();
  const { data: notifications } = useNotificationsQuery();

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;
  const coins = data?.coinBalance ?? 0;
  const popKey = usePopOnIncrease(coins);
  const group = data?.groups?.[0];
  const caption = group
    ? t("space.hudLevel", {
        level: getLevelNumber(getLevelFromCourse(getGroupCourseName(group))),
      })
    : t("nav.student");

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`.trim();

  return (
    <div className="sp-hud">
      <Link to="/profile" className="sp-ava" aria-label={t("nav.profile")}>
        <SpaceAvatar avatar={user.avatar} name={fullName} />
      </Link>
      <Link to="/profile" className="sp-nm">
        <span>{user.firstName}</span>
        <small>{caption}</small>
      </Link>
      <Link
        to="/coins"
        key={popKey}
        className={popKey ? "sp-pill sp-pop" : "sp-pill"}
        id="sp-coin-pill"
        aria-label={`${t("nav.coins")}: ${coins}`}
      >
        <CoinGlyph />
        <span>{coins}</span>
      </Link>
      <div
        className="sp-pill"
        aria-label={`${t("dashboardWidgets.streak")}: ${missions?.streak ?? 0}`}
      >
        <Flame className="sp-flame-ic" aria-hidden="true" strokeWidth={2.2} />
        <span>{missions?.streak ?? 0}</span>
      </div>
      <Link
        to="/notifications"
        className="sp-pill sp-pill-round"
        aria-label={t("nav.notifications")}
      >
        <Bell aria-hidden="true" strokeWidth={2.2} />
        {unread > 0 && (
          <span className="sp-dot">{unread > 99 ? "99+" : unread}</span>
        )}
      </Link>
    </div>
  );
};

/**
 * Navigation level of a page (how many pushes from a tab): tabs = 0; pages
 * opened from a tab or the top bar = 1; pages opened from those = 2. URL
 * depth isn't enough (/settings is opened from /profile).
 */
const LEVELS: [RegExp, number][] = [
  [/^\/lessons\/[^/]+$/, 2],
  [/^\/profile\/edit$/, 2],
  [/^\/settings$/, 2],
  [/^\/groups\/[^/]+$/, 1],
  [/^\/quiz\/[^/]+$/, 1],
  [/^\/(profile|notifications|wishlist)$/, 1],
];
const depthOf = (path: string) =>
  isTab(path) ? 0 : (LEVELS.find(([re]) => re.test(path))?.[1] ?? path.split("/").filter(Boolean).length);
const isTab = (path: string) => studentNavigation.some((n) => n.path === path);

/**
 * iOS navigation transition for the page that just mounted: going deeper
 * pushes (slides in from the right), going back up pops (slides in from the
 * left); switching tabs has no animation, like UITabBarController.
 */
const usePageTransition = (pathname: string) => {
  // Decided during render (not in an effect) so the new page mounts with the
  // right class straight away instead of animating once with a stale one.
  const prev = useRef(pathname);
  const cls = useRef("");
  if (prev.current !== pathname) {
    const from = prev.current;
    const a = depthOf(from);
    const b = depthOf(pathname);
    cls.current =
      isTab(pathname) && isTab(from) ? "" : b > a ? "sp-push" : b < a ? "sp-back-in" : "sp-fade";
    prev.current = pathname;
  }
  return cls.current;
};

/** Browser chrome / status bar colour follows the page background of the theme. */
const useThemeColor = () => {
  const theme = useSettingsStore((s) => s.theme);
  useEffect(() => {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    const before = meta.content;
    meta.content = theme === "dark" ? "#17120e" : "#fbf5ee";
    return () => {
      if (created) meta?.remove();
      else if (meta) meta.content = before;
    };
  }, [theme]);
};

export const StudentLayout = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useTrackNavigationHistory();
  useThemeColor();
  const transition = usePageTransition(pathname);

  // New page → start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="sp">
      <div className="sp-app">
        <Hud />
        <SpaceErrorBoundary
          key={pathname}
          fallback={() => (
            <EmptyState
              icon={WifiOff}
              title={t("common.error")}
              text={t("space.errorHint")}
              className="mt-6"
              action={
                <button
                  className="sp-cta"
                  onClick={() => window.location.reload()}
                >
                  {t("common.retry")}
                </button>
              }
            />
          )}
        >
          {/* A page-shaped skeleton, so a chunk load doesn't flash a loader and then the page's own skeleton. */}
          <div key={pathname} className={transition ? `sp-view ${transition}` : "sp-view"}>
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </SpaceErrorBoundary>
      </div>

      <nav className="sp-nav" aria-label={t("space.navLabel")}>
        <div className="sp-logo">
          <GraduationCap aria-hidden="true" strokeWidth={2.25} />
          ASMO
        </div>
        {studentNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => (isActive ? "on" : undefined)}
          >
            <item.icon aria-hidden="true" strokeWidth={2.1} />
            <span className="sp-nav-label">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
