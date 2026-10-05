// src/teacher/pages/GradingPage.tsx
// Mock `grade` view: pending submissions, each opens <GradeSheet>; a small
// link still opens the full grading page (/submissions/:id).
import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, Clock } from "lucide-react";
import { usePendingSubmissionsQuery } from "@/hooks/queries/useSubmissions";
import { Button } from "@/components/ui";
import { isImageUrl } from "@/lib/utils";
import { getErrorMessage } from "@/lib/toast";
import { formatDateTime } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, EmptyBox, PageHeader, PageSkeleton } from "../components/ui";
import { GradeSheet } from "../components/sheets";

export const GradingPage = () => {
  const { t } = useTranslation();
  const { data: submissions = [], isLoading, error, refetch } = usePendingSubmissionsQuery();
  const [gradeId, setGradeId] = useState<string | null>(null);

  if (isLoading) {
    return <PageSkeleton rows={6} rowClass="h-[84px]" />;
  }

  if (error) {
    return (
      <>
        <PageHeader title={t("grading.title")} />
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={getErrorMessage(error, t("common.error"))}
          action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
        />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title={t("grading.title")}
        subtitle={submissions.length ? t("us.gq.subtitle", { n: submissions.length }) : undefined}
      />

      {submissions.length === 0 ? (
        <EmptyBox title={t("us.gq.empty")} text={t("us.gq.emptyText")} className="!py-10 !px-4" />
      ) : (
        <div className="u-cols u-stack">
          {submissions.map((s) => {
            const name = `${s.student.firstName} ${s.student.lastName}`;
            const extraTitle = s.homework.title && s.homework.title !== s.lesson.topic ? `${s.homework.title} · ` : "";
            return (
              <div key={s.id} className="u-les">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3.5 text-left"
                  onClick={() => setGradeId(s.id)}
                >
                  <Avatar name={name} src={isImageUrl(s.student.avatar) ? s.student.avatar : null} seed={s.student.id} />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[17px]">{name}</b>
                    <small className="u-sub block truncate">
                      {extraTitle}
                      {s.lesson.topic} · {s.lesson.groupName}
                    </small>
                    <small className="mt-0.5 flex items-center gap-1 text-[12.5px] font-bold text-u-gdx">
                      <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />
                      {formatDateTime(s.submittedAt)}
                    </small>
                  </div>
                </button>
                <div className="flex flex-none flex-col items-end gap-1.5">
                  <button type="button" className="u-btn sm" onClick={() => setGradeId(s.id)}>
                    {t("lessonDetail.gradeSubmit")}
                  </button>
                  <Link
                    to={`/submissions/${s.id}`}
                    aria-label={t("us.gq.openFull")}
                    title={t("us.gq.openFull")}
                    className="inline-flex items-center gap-0.5 text-[12.5px] font-bold text-u-mu hover:text-u-pr"
                  >
                    <span className="hidden xl:inline">{t("us.gq.openFull")}</span>
                    <ChevronRight className="u-i s" strokeWidth={2} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <GradeSheet submissionId={gradeId} onClose={() => setGradeId(null)} />
    </div>
  );
};
