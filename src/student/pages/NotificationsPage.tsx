// src/student/pages/NotificationsPage.tsx
// "Kosmik maktab" notifications — same queries/mutations as
// src/pages/NotificationsPage.tsx (the teacher keeps that one).
import "../theme/profile.css";
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
import { EmptyState, ErrorState, PageHeader, Skel, Spinner } from "../components/ui";

const TYPE_EMOJI: Record<string, string> = {
  homework: "📝",
  lesson: "📅",
  grade: "⭐",
  submission: "📩",
  system: "🛰",
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
  };

  return (
    <div className="sp-page">
      <PageHeader
        back={{ to: "/", label: t("nav.dashboard") }}
        title={`🔔 ${t("notifications.title")}`}
        subtitle={
          unreadCount > 0 ? t("notifications.unreadCount", { count: unreadCount }) : t("notifications.allRead")
        }
        right={
          unreadCount > 0 ? (
            <div className="sp-pill">{t("space.profile.unreadPill", { count: unreadCount })}</div>
          ) : undefined
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
            {markAllAsRead.isPending ? <Spinner /> : "✓"} {t("notifications.markAllRead")}
          </button>
        </div>
      )}
      {markAllAsRead.isError && (
        <p className="sp-msg sp-err -mt-2 mb-3" role="alert">
          {t("space.profile.markAllFailed")}
        </p>
      )}

      {notifications.length === 0 ? (
        <EmptyState emoji="📭" title={t("notifications.empty")} text={t("notifications.emptyDesc")} />
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
                {TYPE_EMOJI[n.type] ?? "🔔"}
              </span>
              <span className="sp-t">
                <b>{n.title}</b>
                {n.message && <small>{n.message}</small>}
                <small className="sp-profile-time">🕒 {relativeTime(n.createdAt, language)}</small>
              </span>
              {!n.isRead && <span className="sp-profile-ndot" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
