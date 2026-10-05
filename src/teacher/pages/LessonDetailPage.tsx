// src/teacher/pages/LessonDetailPage.tsx
// Mock `lesson` view: lesson card with homework, then attendance (saved per
// student) next to submissions (graded in <GradeSheet>), then the weekly
// attendance table with coins.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check } from "lucide-react";
import { useLessonDetailQuery, useCreateHomeworkMutation } from "@/hooks/queries/useLessons";
import { useSaveAttendanceMutation, useWeeklyAttendanceQuery } from "@/hooks/queries/useWeeklyAttendance";
import { formatDateTime } from "@/utilist//formatData";
import { useTranslation } from "@/hooks/useTranslation";
import { WeeklyAttendanceTable } from "@/components/Lesson/WeeklyAttendanceTable";
import { LessonHeaderCard } from "@/components/Lesson/LessonHeaderCard";
import type { LessonRosterEntry } from "@/types/teacher";
import { queryKeys } from "@/lib/queryClient";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn, isImageUrl } from "@/lib/utils";
import { Button, Input, Textarea } from "@/components/ui";
import { Avatar, BackButton, CoinTag, EmptyBox, SectionHead, Seg, Skel, Tag } from "../components/ui";
import { GradeSheet } from "../components/sheets";

type AttStatus = "present" | "absent";

/** Homework text clipped to the mock's paper height, with "To'liq ko'rish" when it overflows. */
const HomeworkPaper = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [text, open]);

  return (
    <>
      <div ref={ref} className={cn("u-paper", (open || !overflows) && "full")}>
        {text}
      </div>
      {overflows && (
        <button type="button" className="u-btn soft sm mt-2.5" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          {open ? t("us.ld.showLess") : t("us.ld.showMore")}
        </button>
      )}
    </>
  );
};

export const LessonDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useLessonDetailQuery(id);
  const createHomework = useCreateHomeworkMutation(id ?? "");
  const saveAttendance = useSaveAttendanceMutation();
  // Same query (and cache) as the weekly table below — gives each student's coin balance.
  const { data: week } = useWeeklyAttendanceQuery(data?.lesson.groupId ?? "", data?.lesson.lessonDate);

  const [homeworkForm, setHomeworkForm] = useState({ title: "", description: "", maxScore: "100", deadline: "" });
  const [homeworkError, setHomeworkError] = useState<string | null>(null);
  const [isSavingHomework, setIsSavingHomework] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, AttStatus>>({});
  const [allSaving, setAllSaving] = useState(false);
  const [gradeId, setGradeId] = useState<string | null>(null);

  // Fresh roster from the server replaces the optimistic marks.
  useEffect(() => {
    setOverrides({});
  }, [data?.roster]);

  const coins = useMemo(() => {
    const map: Record<string, number> = {};
    week?.roster.forEach((s) => (map[s.id] = s.coinBalance));
    return map;
  }, [week]);

  const handleCreateHomework = async () => {
    if (!id || !homeworkForm.title.trim() || !homeworkForm.description.trim() || !homeworkForm.deadline) {
      setHomeworkError(t("us.fillRequired"));
      return;
    }
    setIsSavingHomework(true);
    try {
      await createHomework.mutateAsync({
        title: homeworkForm.title,
        description: homeworkForm.description,
        maxScore: Number(homeworkForm.maxScore) || undefined,
        deadline: homeworkForm.deadline,
      });
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSavingHomework(false);
    }
  };

  const refreshAfterAttendance = () => {
    if (!id) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.lesson(id) });
    if (data?.lesson.groupId) queryClient.invalidateQueries({ queryKey: queryKeys.groupDetail(data.lesson.groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  /** One tap on Keldi / Yo'q saves that student's attendance right away. */
  const mark = async (userId: string, status: AttStatus) => {
    if (!id) return;
    const previous = overrides[userId];
    setOverrides((o) => ({ ...o, [userId]: status }));
    try {
      await saveAttendance.mutateAsync({
        lessonId: id,
        records: [{ userId, status: status === "present" ? "PRESENT" : "ABSENT" }],
      });
      refreshAfterAttendance();
    } catch (err) {
      setOverrides((o) => {
        const next = { ...o };
        if (previous) next[userId] = previous;
        else delete next[userId];
        return next;
      });
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const markAll = async (roster: LessonRosterEntry[]) => {
    if (!id || roster.length === 0) return;
    const before = overrides;
    setOverrides((o) => ({ ...o, ...Object.fromEntries(roster.map((s) => [s.id, "present" as const])) }));
    setAllSaving(true);
    try {
      await saveAttendance.mutateAsync({
        lessonId: id,
        records: roster.map((s) => ({ userId: s.id, status: "PRESENT" })),
      });
      toast.success(t("lessonDetail.attendanceSaved"));
      refreshAfterAttendance();
    } catch (err) {
      setOverrides(before);
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setAllSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="mb-2 h-6 w-20 rounded-lg" />
        <Skel className="h-56" />
        <div className="u-two e u-sec">
          <Skel className="h-72" />
          <Skel className="h-72" />
        </div>
      </div>
    );
  }

  if (error || !data || !data.lesson) {
    return (
      <EmptyBox
        tone="er"
        icon={AlertTriangle}
        title={error ? getErrorMessage(error, t("lessonDetail.notFound")) : t("lessonDetail.notFound")}
        action={error ? <Button onClick={() => refetch()}>{t("common.retry")}</Button> : undefined}
      />
    );
  }

  const { lesson, homework } = data;
  const roster: LessonRosterEntry[] = data.roster ?? [];
  const statusOf = (s: LessonRosterEntry): AttStatus | null => overrides[s.id] ?? s.attendanceStatus;
  const presentCount = roster.filter((s) => statusOf(s) === "present").length;
  const submittedCount = roster.filter((s) => s.submission).length;
  const gradedCount = roster.filter((s) => s.submission?.status === "graded").length;
  const nameOf = (s: LessonRosterEntry) => `${s.firstName} ${s.lastName}`;
  const avatarOf = (s: LessonRosterEntry) => (isImageUrl(s.avatar) ? s.avatar : null);

  return (
    <div>
      <BackButton to={`/groups/${lesson.groupId}`} />

      <LessonHeaderCard lesson={lesson}>
        {homework ? (
          <>
            <SectionHead
              level={3}
              title={t("us.ld.hw")}
              right={<Tag tone="er">{t("us.ld.due", { date: formatDateTime(homework.deadline) })}</Tag>}
              className="!mt-3.5 !mb-2"
            />
            {homework.title && homework.title !== lesson.topic && (
              <p className="mb-2 font-bold break-words">{homework.title}</p>
            )}
            <HomeworkPaper text={homework.description} />
            <div className="u-chips mt-2.5">
              <Tag tone="gd">{t("us.ld.max", { n: homework.maxScore })}</Tag>
            </div>
          </>
        ) : (
          <>
            <p className="u-sub">{t("us.ld.noHw")}</p>
            <div className="mt-4 grid gap-3.5 rounded-[18px] bg-u-sf2 p-4">
              <h3>{t("lessonDetail.addHomeworkTitle")}</h3>
              <Input
                type="text"
                label={t("lessonDetail.homeworkTitleLabel")}
                value={homeworkForm.title}
                onChange={(e) => {
                  setHomeworkForm({ ...homeworkForm, title: e.target.value });
                  setHomeworkError(null);
                }}
              />
              <Textarea
                label={t("lessonDetail.homeworkDescLabel")}
                value={homeworkForm.description}
                onChange={(e) => {
                  setHomeworkForm({ ...homeworkForm, description: e.target.value });
                  setHomeworkError(null);
                }}
                rows={5}
              />
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[140px_1fr]">
                <Input
                  type="number"
                  min={1}
                  label={t("lessonDetail.maxScoreLabel")}
                  value={homeworkForm.maxScore}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, maxScore: e.target.value })}
                />
                <Input
                  type="datetime-local"
                  label={t("lessonDetail.deadlineFormLabel")}
                  value={homeworkForm.deadline}
                  onChange={(e) => {
                    setHomeworkForm({ ...homeworkForm, deadline: e.target.value });
                    setHomeworkError(null);
                  }}
                />
              </div>
              {homeworkError && <p className="text-[13px] font-bold text-u-er">{homeworkError}</p>}
              <Button onClick={handleCreateHomework} isLoading={isSavingHomework} fullWidth>
                {t("lessonDetail.createHomework")}
              </Button>
            </div>
          </>
        )}
      </LessonHeaderCard>

      <div className="u-two e u-sec">
        {/* Attendance — each tap saves */}
        <div className="u-card">
          <SectionHead
            title={t("lessonDetail.attendanceTitle")}
            right={
              <Tag tone={presentCount === roster.length && presentCount > 0 ? "ok" : "mu"}>
                {t("us.ld.came", { ok: presentCount, total: roster.length })}
              </Tag>
            }
          />
          {roster.length === 0 ? (
            <p className="u-sub">{t("us.ld.noStudents")}</p>
          ) : (
            <>
              <div className="u-stack">
                {roster.map((s) => (
                  <div key={s.id} className="u-row flex-wrap">
                    <Avatar name={nameOf(s)} src={avatarOf(s)} seed={s.id} />
                    <div className="g">
                      <b className="truncate">{nameOf(s)}</b>
                      {coins[s.id] !== undefined && <CoinTag n={coins[s.id]} />}
                    </div>
                    <Seg<AttStatus>
                      small
                      label={nameOf(s)}
                      value={statusOf(s)}
                      onChange={(v) => mark(s.id, v)}
                      options={[
                        { value: "present", label: t("us.ld.present"), tone: "ok" },
                        { value: "absent", label: t("us.ld.absent"), tone: "er" },
                      ]}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="u-btn soft block mt-3"
                onClick={() => markAll(roster)}
                disabled={allSaving}
              >
                <Check className="u-i m" strokeWidth={2} aria-hidden="true" />
                {t("us.ld.allIn")}
              </button>
            </>
          )}
        </div>

        {/* Submissions */}
        <div className="u-card">
          <SectionHead
            title={t("us.ld.subs")}
            right={
              <Tag tone="mu">
                {submittedCount}/{roster.length}
              </Tag>
            }
          />
          {!homework ? (
            <p className="u-sub">{t("us.ld.noHw")}</p>
          ) : roster.length === 0 ? (
            <p className="u-sub">{t("us.ld.noStudents")}</p>
          ) : (
            <>
              <p className="u-sub !mt-0 mb-3 text-[13.5px]">
                {t("lessonDetail.rosterSummary", { submitted: submittedCount, total: roster.length, graded: gradedCount })}
              </p>
              <div className="u-stack">
                {roster.map((s) => {
                  const sub = s.submission;
                  return (
                    <div key={s.id} className="u-row">
                      <Avatar name={nameOf(s)} src={avatarOf(s)} seed={s.id} />
                      <div className="g">
                        <b className="truncate">{nameOf(s)}</b>
                        <small>
                          {!sub
                            ? t("us.ld.notSubmitted")
                            : sub.status === "graded"
                              ? t("lessonDetail.graded")
                              : t("us.ld.awaiting")}
                          {sub?.submittedAt ? ` · ${formatDateTime(sub.submittedAt)}` : ""}
                        </small>
                      </div>
                      {!sub ? (
                        <Tag tone="mu">{t("lessonDetail.waiting")}</Tag>
                      ) : sub.status === "graded" ? (
                        <button type="button" className="u-coin !text-base" onClick={() => setGradeId(sub.id)}>
                          {sub.score}/{homework.maxScore}
                        </button>
                      ) : (
                        <button type="button" className="u-btn sm" onClick={() => setGradeId(sub.id)}>
                          {t("lessonDetail.gradeSubmit")}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <section className="u-sec">
        <SectionHead title={t("us.ld.weekly")} />
        <WeeklyAttendanceTable groupId={lesson.groupId} referenceDate={lesson.lessonDate} />
      </section>

      <GradeSheet submissionId={gradeId} onClose={() => setGradeId(null)} />
    </div>
  );
};
