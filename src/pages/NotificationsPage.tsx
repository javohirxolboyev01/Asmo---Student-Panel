// src/pages/NotificationsPage.tsx
// Mock `notif` view: a stack of message rows (red mail icon when unread).
// Opening one marks it read; a new-submission message opens the grade sheet.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Bell, Check, Mail } from "lucide-react";
import {
  useNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} from "@/hooks/queries/useNotifications";
import type { Notification } from "@/types/notification";
import { getRelativeTime } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui";
import { GradeSheet } from "@/teacher/components/sheets";
import { EmptyBox, PageHeader, Skel } from "@/teacher/components/ui";

// The backend may name the submission link differently — try each field.
const getSubmissionId = (n: Notification): string | undefined => {
  const candidate = n.relatedId ?? n.submissionId ?? n.entityId ?? n.targetId;
  return typeof candidate === "string" ? candidate : undefined;
};

export const NotificationsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading, isError, refetch } = useNotificationsQuery();
  const markAsRead = useMarkNotificationAsReadMutation();
  const markAllAsRead = useMarkAllNotificationsAsReadMutation();
  const [gradeId, setGradeId] = useState<string | null>(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleOpen = (notification: Notification) => {
    if (!notification.isRead) markAsRead.mutate(notification.id);
    if (notification.type === "submission") {
      const submissionId = getSubmissionId(notification);
      if (submissionId) setGradeId(submissionId);
      else navigate("/grading");
    }
  };

  const header = (
    <PageHeader
      back={{ to: "/more" }}
      title={t("notifications.title")}
      subtitle={unreadCount > 0 ? t("us.notif.hasNew") : t("us.notif.allRead")}
      right={
        unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            aria-label={t("notifications.markAllRead")}
            onClick={() => markAllAsRead.mutate()}
            isLoading={markAllAsRead.isPending}
            leftIcon={<Check className="u-i s" strokeWidth={2} aria-hidden="true" />}
          >
            <span className="hidden sm:inline">{t("notifications.markAllRead")}</span>
          </Button>
        )
      }
    />
  );

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="mt-2 h-5 w-20 rounded-lg" />
        <Skel className="mt-3 h-8 w-1/2 rounded-xl" />
        <Skel className="mt-2 h-4 w-1/3 rounded-lg" />
        <div className="u-stack mt-6" style={{ maxWidth: 680 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <Skel key={i} className="h-[74px] rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {header}

      {isError && notifications.length === 0 ? (
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={t("common.error")}
          action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
        />
      ) : notifications.length === 0 ? (
        <EmptyBox tone="mu" icon={Bell} title={t("notifications.empty")} text={t("notifications.emptyDesc")} />
      ) : (
        <div className="u-stack" style={{ maxWidth: 680 }}>
          {notifications.map((n) => (
            <button key={n.id} type="button" className="u-nt" onClick={() => handleOpen(n)}>
              <span
                className="u-mi"
                style={
                  n.isRead
                    ? { background: "var(--sf2)", color: "var(--mu)" }
                    : { background: "var(--ert)", color: "var(--er)" }
                }
              >
                <Mail className="u-i" strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <b className="block break-words">{n.title}</b>
                <p className="u-sub break-words" style={{ margin: 0 }}>
                  {n.message}
                </p>
              </div>
              <small className="u-sub flex-none whitespace-nowrap" style={{ margin: 0 }}>
                {getRelativeTime(n.createdAt)}
              </small>
            </button>
          ))}
        </div>
      )}

      {gradeId && <GradeSheet submissionId={gradeId} onClose={() => setGradeId(null)} />}
    </>
  );
};
