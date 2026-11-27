// src/student/pages/NotificationsPage.tsx
// Student notifications — same queries/mutations as
// src/pages/NotificationsPage.tsx (the teacher keeps that one).
import "../theme/profile.css";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, parseISO, type Locale } from "date-fns";
import { enUS, ru, uz } from "date-fns/locale";
import {
  useNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "@/hooks/queries/useNotifications";
import type { Notification } from "@/types/notification";
import type { Language } from "@/i18n/translations";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import { isCoinNotification, notificationTitle } from "@/lib/notificationTitle";
import { Bell, BellOff, ChevronRight, Gem, CalendarDays, CheckCheck, FileQuestion, Inbox, PencilLine, Star, type LucideIcon } from "lucide-react";
import { EmptyState, ErrorState, PageHeader, Skel, Spinner } from "../components/ui";
import { IconTile, type Tint } from "../components/icons";

const TYPE_ICON: Record<string, { icon: LucideIcon; tint: Tint }> = {
  homework: { icon: PencilLine, tint: "orange" },
  lesson: { icon: CalendarDays, tint: "red" },
  grade: { icon: Star, tint: "yellow" },
  submission: { icon: Inbox, tint: "blue" },
  quiz: { icon: FileQuestion, tint: "blue" },
  system: { icon: Bell, tint: "gray" },
};

/**
 * Where tapping a notification goes. Homework/grade notifications carry the
 * lesson id in relatedId (older ones don't → the groups list); coin updates
 * open the coin history; a new test opens the test.
 */
const targetOf = (n: Notification): string | null => {
  const related = typeof n.relatedId === "string" && n.relatedId ? n.relatedId : null;
  if (isCoinNotification(n.title)) return "/coins";
  switch (n.type) {
    case "homework":
    case "grade":
    case "lesson":
      return related ? `/lessons/${related}#homework` : "/groups";
    case "quiz":
      return related ? `/quiz/${related}` : "/";
    default:
      return null;
  }
};

const DATE_LOCALE = { uz, ru, en: enUS } satisfies Record<Language, Locale>;

const relativeTime = (date: string, language: Language) => {
  try {
    return formatDistanceToNow(parseISO(date), { addSuffix: true, locale: DATE_LOCALE[language] });
  } catch {
    return "";
  }
};

const NotificationsSkeleton = () => (
  <div aria-busy="true">
    <Skel className="mt-5 h-9 w-1/2" />
    <Skel className="mt-2 h-4 w-1/3" />
    <div className="sp-profile-notes mt-5">
      {Array.from({ length: 6 }, (_, i) => (
        <Skel key={i} className="mb-2.5 h-20" />
      ))}
    </div>
  </div>
);

export const NotificationsPage = () => {
  const { t, language } = useTranslation();
  const { data, isLoading, error, refetch } = useNotificationsQuery();
  const markAsRead = useMarkNotificationAsReadMutation();
  const markAllAsRead = useMarkAllNotificationsAsReadMutation();
  const navigate = useNavigate();

  if (isLoading && !data) return <NotificationsSkeleton />;

  if (error && !data) {
    return (
      <div className="sp-page">
        <ErrorState message={getErrorMessage(error, t("common.error"))} onRetry={() => refetch()} />
      </div>
    );
  }

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const open = (n: Notification) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    const to = targetOf(n);
    if (to) navigate(to);
  };

  return (
    <div className="sp-page">
      <PageHeader
        back={{ to: "/", label: t("nav.dashboard") }}
        title={t("notifications.title")}
        subtitle={
          unreadCount > 0 ? t("notifications.unreadCount", { count: unreadCount }) : t("notifications.allRead")
        }
      />

      {unreadCount > 0 && (
        <div className="sp-frow">
          <button
            type="button"
            className="sp-btn"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            {markAllAsRead.isPending ? <Spinner /> : <CheckCheck aria-hidden="true" />} {t("notifications.markAllRead")}
          </button>
        </div>
      )}
      {markAllAsRead.isError && (
        <p className="sp-msg sp-err -mt-2 mb-3" role="alert">
          {t("space.profile.markAllFailed")}
        </p>
      )}

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title={t("notifications.empty")} text={t("notifications.emptyDesc")} />
      ) : (
        <div className="sp-profile-notes">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              className={n.isRead ? "sp-row sp-profile-note" : "sp-row sp-profile-note sp-profile-unread"}
              onClick={() => open(n)}
            >
              <span className="sp-ic" aria-hidden="true">
                <IconTile
                  {...(isCoinNotification(n.title) ? { icon: Gem, tint: "teal" as Tint } : (TYPE_ICON[n.type] ?? TYPE_ICON.system))}
                />
              </span>
              <span className="sp-t">
                <b>{notificationTitle(n.title, t)}</b>
                {n.message && <small>{n.message}</small>}
                <small className="sp-profile-time">{relativeTime(n.createdAt, language)}</small>
              </span>
              {!n.isRead && (
                <span className="sp-badge sp-profile-newtag">
                  <span className="sp-profile-ndot" aria-hidden="true" /> {t("notes.unread")}
                </span>
              )}
              {targetOf(n) && <ChevronRight className="sp-chev" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
