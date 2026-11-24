// src/teacher/pages/GradingPage.tsx
// The grading queue: every submission still waiting for a score, oldest
// first, filterable by group. Each opens <GradeSheet> ("Save & next" walks
// the queue); a small link still opens the full grading page.
import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BookOpen, ChevronRight, Clock } from "lucide-react";
import { usePendingSubmissionsQuery } from "@/hooks/queries/useSubmissions";
import { Button } from "@/components/ui";
import { isImageUrl } from "@/lib/utils";
import { getErrorMessage } from "@/lib/toast";
import { formatDateTime } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Avatar,
  EmptyBox,
  PageHeader,
  PageSkeleton,
  Tag,
} from "../components/ui";
import { GradeSheet, isLateSubmission } from "../components/sheets";
import "../theme/lesson.css";

export const GradingPage = () => {
  const { t } = useTranslation();
  const {
    data: submissions = [],
    isLoading,
    error,
    refetch,
  } = usePendingSubmissionsQuery();
  const [gradeId, setGradeId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>("all");

  if (isLoading) {
    return <PageSkeleton rows={6} rowClass="h-[96px]" />;
  }

  if (error) {
    return (
      <>
        <PageHeader title={t("grading.title")} subtitle={t("us.gq.hint")} />
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={getErrorMessage(error, t("common.error"))}
          action={
            <Button onClick={() => refetch()}>{t("common.retry")}</Button>
          }
        />
      </>
    );
  }

  // Oldest first: whoever handed in first waits the longest.
  const queue = [...submissions].sort(
    (a, b) =>
      new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
  );
  const groups = [
    ...new Map(
      queue.map((s) => [s.lesson.groupId, s.lesson.groupName]),
    ).entries(),
  ];
  const visible =
    groupFilter === "all"
      ? queue
      : queue.filter((s) => s.lesson.groupId === groupFilter);
  const nextAfter = (id: string) => {
    const rest = visible.filter((s) => s.id !== id);
    const i = visible.findIndex((s) => s.id === id);
    return rest[i] ?? rest[0] ?? null;
  };

  return (
    <div>
      <PageHeader
        title={t("grading.title")}
        subtitle={
          submissions.length
            ? t("us.gq.subtitle", { n: submissions.length })
            : t("us.gq.hint")
        }
      />

      {submissions.length === 0 ? (
        <EmptyBox
          title={t("us.gq.empty")}
          text={t("us.gq.emptyText")}
          className="!py-10 !px-4"
        />
      ) : (
        <>
          {groups.length > 1 && (
            <div
              className="u-chips sc mb-4"
              role="group"
              aria-label={t("us.lesson.group")}
            >
              <button
                type="button"
                className={groupFilter === "all" ? "u-chip sel" : "u-chip"}
                aria-pressed={groupFilter === "all"}
                onClick={() => setGroupFilter("all")}
              >
                {t("us.gq.all", { n: queue.length })}
              </button>
              {groups.map(([gid, name]) => (
                <button
                  key={gid}
                  type="button"
                  className={groupFilter === gid ? "u-chip sel" : "u-chip"}
                  aria-pressed={groupFilter === gid}
                  onClick={() => setGroupFilter(gid)}
                >
                  {name} ·{" "}
                  {queue.filter((s) => s.lesson.groupId === gid).length}
                </button>
              ))}
            </div>
          )}
          <p className="u-hint mb-3">{t("us.gq.order")}</p>
          <div className="u-cols u-stack">
            {visible.map((s) => {
              const name = `${s.student.firstName} ${s.student.lastName}`;
              const hwTitle =
                s.homework.title && s.homework.title !== s.lesson.topic
                  ? s.homework.title
                  : null;
              const late = isLateSubmission(s.submittedAt, s.homework.deadline);
              return (
                <div key={s.id} className="u-les u-gq-item">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
                    onClick={() => setGradeId(s.id)}
                    aria-label={`${t("lessonDetail.gradeSubmit")}: ${name}, ${s.lesson.topic}`}
                  >
                    <Avatar
                      name={name}
                      src={
                        isImageUrl(s.student.avatar) ? s.student.avatar : null
                      }
                      seed={s.student.id}
                    />
                    <div className="min-w-0 flex-1">
                      <b className="block truncate text-[17px]">{name}</b>
                      <small className="u-sub !mt-0.5 flex items-center gap-1 break-words">
                        <BookOpen
                          className="u-i s flex-none"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                        <span className="min-w-0 truncate">
                          {hwTitle ? `${hwTitle} · ` : ""}
                          {s.lesson.topic}
                        </span>
                      </small>
                      <div className="u-gq-meta">
                        <Tag tone="mu">{s.lesson.groupName}</Tag>
                        <Tag tone="gd">
                          <Clock
                            className="u-i s"
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                          {formatDateTime(s.submittedAt)}
                        </Tag>
                        {late && (
                          <Tag className="u-late">{t("us.ld.late")}</Tag>
                        )}
                        <Tag tone="mu">
                          {t("us.ld.max", { n: s.homework.maxScore })}
                        </Tag>
                      </div>
                    </div>
                  </button>
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <button
                      type="button"
                      className="u-btn sm min-h-[44px]"
                      onClick={() => setGradeId(s.id)}
                    >
                      {t("lessonDetail.gradeSubmit")}
                    </button>
                    <Link
                      to={`/submissions/${s.id}`}
                      aria-label={t("us.gq.openFull")}
                      title={t("us.gq.openFull")}
                      className="inline-flex min-h-[32px] items-center gap-0.5 text-[12.5px] font-bold text-u-mu hover:text-u-pr"
                    >
                      <span className="hidden xl:inline">
                        {t("us.gq.openFull")}
                      </span>
                      <ChevronRight
                        className="u-i s"
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <GradeSheet
        submissionId={gradeId}
        onClose={() => setGradeId(null)}
        onNext={
          gradeId && nextAfter(gradeId)
            ? () => setGradeId(nextAfter(gradeId)!.id)
            : undefined
        }
      />
    </div>
  );
};
