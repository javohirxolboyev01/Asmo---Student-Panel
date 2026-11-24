// src/teacher/layout/TeacherLayout.tsx
// App shell of the teacher panel (iOS style): a frosted navigation bar
// (brand or the page's back button, compact page title, bell, avatar), an
// iPad-style sidebar on desktop and a floating glass tab bar on phones;
// iOS push/pop transitions between pages. Styles: theme/ustoz.css.
import "../theme/ustoz.css";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { TopBarContext, type TopBarState } from "../components/topBar";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Bell, GraduationCap } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTrackNavigationHistory } from "@/hooks/useNavigationHistory";
import { useNotificationsQuery } from "@/hooks/queries/useNotifications";
import { usePendingSubmissionsQuery } from "@/hooks/queries/useSubmissions";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { cn } from "@/lib/utils";
import { Avatar, BackLink, PageSkeleton } from "../components/ui";
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

/** Tab roots (phone tab bar + desktop sidebar): switching between them doesn't animate. */
const isRoot = (path: string) =>
  [...teacherMainNav, ...teacherExtraNav, teacherMoreNav].some((n) => n.path === path);

/**
 * Navigation level of a page (pushes from a tab root); URL depth alone isn't
 * enough (/settings is opened from /more).
 */
const LEVELS: [RegExp, number][] = [
  [/^\/lessons\/[^/]+$/, 2],
  [/^\/profile\/edit$/, 2],
  [/^\/tests\/[^/]+\/(edit|results)$/, 2],
  [/^\/(groups|students|submissions)\/[^/]+$/, 1],
  [/^\/tests\/new$/, 1],
  [/^\/(attendance|shop|teachers|notifications|settings)$/, 1],
];
const levelOf = (path: string) =>
  isRoot(path) ? 0 : (LEVELS.find(([re]) => re.test(path))?.[1] ?? path.split("/").filter(Boolean).length);

/** iOS push (deeper) / pop (back up) for the page that just mounted; decided during render. */
const usePageTransition = (pathname: string) => {
  const prev = useRef(pathname);
  const cls = useRef("");
  if (prev.current !== pathname) {
    const from = prev.current;
    const a = levelOf(from);
    const b = levelOf(pathname);
    cls.current = isRoot(pathname) && isRoot(from) ? "" : b > a ? "u-push" : b < a ? "u-pop-in" : "u-fade";
    prev.current = pathname;
  }
  return cls.current;
};

/** Browser chrome / status bar colour follows the iOS background of the theme. */
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
    meta.content = theme === "dark" ? "#000000" : "#f2f2f7";
    return () => {
      if (created) meta?.remove();
      else if (meta) meta.content = before;
    };
  }, [theme]);
};

export const TeacherLayout = () => {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const { data: notifications } = useNotificationsQuery();
  const { data: pending } = usePendingSubmissionsQuery();
  useTrackNavigationHistory();
  useThemeColor();
  const transition = usePageTransition(pathname);
  const [bar, setBar] = useState<TopBarState | null>(null);
  const barApi = useMemo(() => ({ set: setBar }), []);

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
          <header className={bar?.collapsed ? "u-top on" : "u-top"}>
            {bar?.back ? (
              <div className="u-brand u-top-back">
                <BackLink to={bar.back.to} />
              </div>
            ) : (
              <Link to="/" className="u-brand">
                <span className="u-bm">
                  <GraduationCap className="u-i" strokeWidth={2} aria-hidden="true" />
                </span>
                {t("us.brand")}
              </Link>
            )}
            {bar?.title ? (
              <div className="u-top-title" aria-hidden={!bar.collapsed}>
                {bar.title}
              </div>
            ) : null}
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
            <TopBarContext.Provider value={barApi}>
              <ErrorBoundary key={pathname}>
                <div key={pathname} className={transition ? `u-view ${transition}` : "u-view"}>
                  {/* Page-shaped placeholder while a page's chunk loads. */}
                  <Suspense fallback={<PageSkeleton />}>
                    <Outlet />
                  </Suspense>
                </div>
              </ErrorBoundary>
            </TopBarContext.Provider>
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
