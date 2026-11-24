// src/teacher/pages/SubmissionGradePage.tsx
// Full-page grading (deep links from notifications / old links), the same
// form as <GradeSheet> in the mock's language: answer, quick scores, score,
// feedback chips + text.
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Calendar, Clock } from "lucide-react";
import {
  useSubmissionDetailQuery,
  useGradeSubmissionMutation,
} from "@/hooks/queries/useSubmissions";
import { useGoBack } from "@/hooks/useNavigationHistory";
import { Button, Input, Textarea } from "@/components/ui";
import { cn, isImageUrl } from "@/lib/utils";
import { formatDateTime } from "@/utilist/formatData";
import { queryKeys } from "@/lib/queryClient";
import { toast, getErrorMessage } from "@/lib/toast";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Avatar,
  BackButton,
  EmptyBox,
  SectionHead,
  Skel,
  Tag,
} from "../components/ui";
import { SubmissionAttachment, isLateSubmission } from "../components/sheets";
import "../theme/lesson.css";

const FEEDBACK_KEYS = [
  "us.grade.fbGreat",
  "us.grade.fbGood",
  "us.grade.fbRetry",
] as const;

export const SubmissionGradePage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const goBack = useGoBack("/grading");
  const {
    data: submission,
    isLoading,
    error,
    refetch,
  } = useSubmissionDetailQuery(id);
  const grade = useGradeSubmissionMutation();
  const [score, setScore] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const feedbackOptions = FEEDBACK_KEYS.map((key) => t(key));
  const max = submission?.homework.maxScore ?? 100;

  useEffect(() => {
    if (!submission) return;
    setScore(submission.score !== null ? String(submission.score) : "");
    // Saved feedback: known chips back into chips, the rest stays text.
    const parts = (submission.feedback ?? "").split(/\s*·\s*/).filter(Boolean);
    setChips(parts.filter((p) => feedbackOptions.includes(p)));
    setNote(parts.filter((p) => !feedbackOptions.includes(p)).join(" · "));
    setFormError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission?.id]);

  const presets = useMemo(
    () => [
      ...new Set(
        [50, 60, 70, 80, 90, 100].map((p) => Math.round((max * p) / 100)),
      ),
    ],
    [max],
  );

  const save = async () => {
    if (!id || !submission) return;
    const value = Number(score);
    if (score === "" || !Number.isFinite(value) || value < 0 || value > max) {
      setFormError(t("us.grade.scoreRange", { max }));
      return;
    }
    const feedback = [...chips, note.trim()].filter(Boolean).join(" · ");
    try {
      await grade.mutateAsync({
        id,
        payload: { score: Math.round(value), feedback: feedback || undefined },
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.lesson(submission.lesson.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentDetail(submission.student.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupDetail(submission.lesson.groupId),
      });
      toast.success(t("us.grade.saved"));
      goBack();
    } catch (err) {
      setFormError(getErrorMessage(err, t("common.error")));
    }
  };

  if (isLoading) {
    return (
      <div aria-busy="true" className="lg:mx-auto lg:max-w-3xl">
        <Skel className="mb-2 h-6 w-20 rounded-lg" />
        <Skel className="h-32" />
        <Skel className="u-sec h-48" />
        <Skel className="u-sec h-64" />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <>
        <BackButton to="/grading" />
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={
            error
              ? getErrorMessage(error, t("grading.notFound"))
              : t("grading.notFound")
          }
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              {error && (
                <Button variant="outline" onClick={() => refetch()}>
                  {t("common.retry")}
                </Button>
              )}
              <Button onClick={goBack}>{t("grading.backToGrading")}</Button>
            </div>
          }
        />
      </>
    );
  }

  const { student, homework, lesson } = submission;
  const name = `${student.firstName} ${student.lastName}`;
  const graded = submission.status === "graded";
  const late = isLateSubmission(submission.submittedAt, homework.deadline);

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <BackButton to="/grading" />

      {/* Student + lesson */}
      <div className="u-card">
        <div className="flex items-center gap-3.5">
          <Avatar
            name={name}
            src={isImageUrl(student.avatar) ? student.avatar : null}
            seed={student.id}
          />
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-[24px]">{name}</h1>
            <p className="u-sub !mt-0.5 break-words">
              {lesson.topic} · {lesson.groupName}
            </p>
          </div>
          <Tag tone={graded ? "ok" : "gd"} className="flex-none">
            {graded ? t("lessonDetail.graded") : t("us.ld.awaiting")}
          </Tag>
        </div>
        <div className="u-row mt-4 !items-start">
          <div className="g">
            <b className="break-words">{homework.title}</b>
            <div className="u-chips mt-2">
              <Tag tone="er">
                <Calendar
                  className="u-i s"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {t("us.ld.due", { date: formatDateTime(homework.deadline) })}
              </Tag>
              <Tag tone="gd">{t("us.ld.max", { n: homework.maxScore })}</Tag>
              {late && <Tag className="u-late">{t("us.ld.late")}</Tag>}
            </div>
          </div>
        </div>
      </div>

      <div className="u-grade-two u-sec">
        {/* Answer */}
        <section className="u-card">
          <SectionHead
            level={3}
            title={t("us.grade.answer")}
            right={
              <span className="u-chip">
                <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />
                {formatDateTime(submission.submittedAt)}
              </span>
            }
            className="flex-wrap"
          />
          <div className="u-paper full">
            {submission.content || t("us.grade.noAnswer")}
          </div>
          {submission.attachmentUrl && (
            <SubmissionAttachment url={submission.attachmentUrl} />
          )}
        </section>

        {/* Grade */}
        <section className="u-card u-sec grid gap-3.5">
          <h3>{t("lessonDetail.gradeTitle")}</h3>
          <div>
            <p className="u-sub !mt-0 mb-2 font-bold">{t("us.grade.quick")}</p>
            <div className="u-chips">
              {presets.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={score === String(v)}
                  className={cn("u-preset", score === String(v) && "sel")}
                  onClick={() => {
                    setScore(String(v));
                    setFormError(null);
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            label={t("us.grade.scoreOf", { max })}
            aria-invalid={!!formError}
            value={score}
            onChange={(e) => {
              setScore(e.target.value);
              setFormError(null);
            }}
          />
          <div
            className="u-tg"
            role="group"
            aria-label={t("lessonDetail.feedbackLabel")}
          >
            {feedbackOptions.map((option) => {
              const on = chips.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={on}
                  className={on ? "on" : undefined}
                  onClick={() =>
                    setChips((prev) =>
                      on ? prev.filter((c) => c !== option) : [...prev, option],
                    )
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
          <Textarea
            label={t("lessonDetail.feedbackLabel")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("us.grade.notePh")}
            className="min-h-[72px]"
            maxLength={4000}
          />
          {formError && (
            <p className="text-[13px] font-bold text-u-er">{formError}</p>
          )}
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={goBack}>
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={save}
              isLoading={grade.isPending}
            >
              {t("us.grade.save")}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};
