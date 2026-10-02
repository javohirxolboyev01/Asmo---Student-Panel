// src/student/layout/StudentLayout.tsx
// App shell of the student panel ("Kosmik maktab"): starry sky, HUD on top of
// every page, and one nav that is a floating bottom bar on mobile and a left
// rail on desktop (pure CSS, see space.css). The teacher panel keeps the
// shared components/Layout.
import "../theme/space.css";
import { Suspense, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Rocket } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTrackNavigationHistory } from "@/hooks/useNavigationHistory";
import { useDashboardQuery } from "@/hooks/queries/useDashboard";
import { useNotificationsQuery } from "@/hooks/queries/useNotifications";
import { useMissionsTodayQuery } from "@/hooks/queries/useMissions";
import { SpaceAvatar } from "../components/SpaceAvatar";
import { EmptyState, PageSkeleton, SpaceErrorBoundary } from "../components/ui";
import { getGroupCourseName, getLevelFromCourse, getLevelNumber } from "../lib/level";
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
    ? t("space.hudLevel", { level: getLevelNumber(getLevelFromCourse(getGroupCourseName(group))) })
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
        💎 <span>{coins}</span>
      </Link>
      <div className="sp-pill" aria-label={`${t("dashboardWidgets.streak")}: ${missions?.streak ?? 0}`}>
        🔥 {missions?.streak ?? 0}
      </div>
      <Link to="/notifications" className="sp-pill" aria-label={t("nav.notifications")}>
        🔔
        {unread > 0 && <span className="sp-dot">{unread > 99 ? "99+" : unread}</span>}
      </Link>
    </div>
  );
};

export const StudentLayout = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useTrackNavigationHistory();

  // New page → start at the top (the mock does window.scrollTo(0,0) on nav).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="sp">
      <div className="sp-stars" aria-hidden="true" />
      <div className="sp-app">
        <Hud />
        <SpaceErrorBoundary
          key={pathname}
          fallback={() => (
            <EmptyState
              emoji="🛰"
              title={t("common.error")}
              text={t("space.errorHint")}
              className="mt-6"
              action={
                <button className="sp-cta" onClick={() => window.location.reload()}>
                  {t("common.retry")}
                </button>
              }
            />
          )}
        >
          {/* A page-shaped skeleton, so a chunk load doesn't flash a loader and then the page's own skeleton. */}
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </SpaceErrorBoundary>
      </div>

      <nav className="sp-nav" aria-label={t("space.navLabel")}>
        <div className="sp-logo">
          <Rocket aria-hidden="true" strokeWidth={2.25} />
          ASMO
        </div>
        {studentNavigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) => (isActive ? "on" : undefined)}
          >
            <item.icon aria-hidden="true" strokeWidth={2} />
            <span className="sp-nav-label">{t(item.labelKey)}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
};
