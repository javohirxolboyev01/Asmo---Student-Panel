// src/teacher/layout/TeacherLayout.tsx
// App shell of the teacher panel, 1:1 with the "Ustoz paneli" mock: sticky
// top bar (brand, bell, avatar), a white left rail on desktop and a floating
// six-tab bar on phones. Styles: theme/ustoz.css.
import "../theme/ustoz.css";
import { Suspense, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Bell, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTrackNavigationHistory } from "@/hooks/useNavigationHistory";
import { useNotificationsQuery } from "@/hooks/queries/useNotifications";
import { usePendingSubmissionsQuery } from "@/hooks/queries/useSubmissions";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { cn } from "@/lib/utils";
import { Avatar, PageSkeleton } from "../components/ui";
import {
  isMoreActiveOnMobile,
  isNavActive,
  teacherExtraNav,
  teacherMainNav,
  teacherMoreNav,
  type TeacherNavItem,
} from "../navigation";

const Badge = ({ count }: { count: number }) =>
  count > 0 ? <span className="u-bdg">{count > 99 ? "99+" : count}</span> : null;

export const TeacherLayout = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const { data: notifications } = useNotificationsQuery();
  const { data: pending } = usePendingSubmissionsQuery();
  useTrackNavigationHistory();

  // New page → start at the top (the mock does scrollTo(0,0) on navigation).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : "";
  const hasUnread = notifications?.some((n) => !n.isRead) ?? false;
  const pendingCount = pending?.length ?? 0;
  const badgeOf = (item: TeacherNavItem) => (item.path === "/grading" ? pendingCount : 0);

  const railLink = (item: TeacherNavItem) => {
    const on = isNavActive(item, pathname);
    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn("u-nav", on && "on")}
        aria-current={on ? "page" : undefined}
      >
        <item.icon className="u-i" strokeWidth={2} aria-hidden="true" />
        {t(item.labelKey)}
        <Badge count={badgeOf(item)} />
      </Link>
    );
  };

  return (
    <div className="us">
      <div className="u-app">
        <aside className="u-side" aria-label={t("us.navLabel")}>
          <Link to="/" className="u-logo">
            <span className="u-bm">
              <GraduationCap className="u-i" strokeWidth={2} aria-hidden="true" />
            </span>
            {t("us.brand")}
          </Link>
          {teacherMainNav.map(railLink)}
          <div className="u-sep" aria-hidden="true" />
          {teacherExtraNav.map(railLink)}
          {railLink(teacherMoreNav)}
          {user && (
            <Link to="/more" className="u-me">
              <Avatar name={fullName} src={user.avatar} seed={user.id} />
              <div>
                <b>{fullName}</b>
                <small className="u-sub">{t("nav.teacher")}</small>
              </div>
            </Link>
          )}
        </aside>

        <div className="min-w-0">
          <header className="u-top">
            <Link to="/" className="u-brand">
              <span className="u-bm">
                <GraduationCap className="u-i" strokeWidth={2} aria-hidden="true" />
              </span>
              {t("us.brand")}
            </Link>
            <Link to="/notifications" className="u-bell" aria-label={t("nav.notifications")}>
              <Bell className="u-i" strokeWidth={2} aria-hidden="true" />
              {hasUnread && <i />}
            </Link>
            {user && (
              <Link to="/more" aria-label={t("nav.profile")} className="rounded-full">
                <Avatar name={fullName} src={user.avatar} seed={user.id} size="s" />
              </Link>
            )}
          </header>

          <main className="u-main">
            <ErrorBoundary key={pathname}>
              {/* Page-shaped placeholder while a page's chunk loads. */}
              <Suspense fallback={<PageSkeleton />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>

      <nav className="u-bn" aria-label={t("us.navLabel")}>
        {[...teacherMainNav, teacherMoreNav].map((item) => {
          const on = item === teacherMoreNav ? isMoreActiveOnMobile(pathname) : isNavActive(item, pathname);
          return (
            <Link key={item.path} to={item.path} className={on ? "on" : undefined} aria-current={on ? "page" : undefined}>
              <span className="p">
                <item.icon className="u-i" strokeWidth={2} aria-hidden="true" />
              </span>
              <span>{t(item.labelKey)}</span>
              <Badge count={badgeOf(item)} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
