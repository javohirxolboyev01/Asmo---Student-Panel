// src/teacher/pages/LessonDetailPage.tsx
// One lesson, top to bottom: header card (topic, lesson N, date & time,
// status, group, description), then the work of the lesson side by side —
// attendance (each tap saves) and homework (task, X/Y submitted, the queue to
// grade in <GradeSheet>, or the form to give homework) — then the weekly
// attendance table with coins.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  Check,
  Clock,
  Hash,
  Paperclip,
  PencilLine,
  User,
} from "lucide-react";
import {
  useLessonDetailQuery,
  useCreateHomeworkMutation,
} from "@/hooks/queries/useLessons";
import {
  useSaveAttendanceMutation,
  useWeeklyAttendanceQuery,
} from "@/hooks/queries/useWeeklyAttendance";
import { formatDate, formatDateTime, formatTime } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";
import { WeeklyAttendanceTable } from "@/components/Lesson/WeeklyAttendanceTable";
import type { LessonRosterEntry } from "@/types/teacher";
import { queryKeys } from "@/lib/queryClient";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn, isImageUrl } from "@/lib/utils";
import { Button, Input, Textarea } from "@/components/ui";
import {
  Avatar,
  BackButton,
  CoinTag,
  EmptyBox,
  SectionHead,
  Seg,
  Skel,
  Tag,
} from "../components/ui";
import { GradeSheet } from "../components/sheets";
import { dayOffset } from "../components/LessonTimeline";
import "../theme/lesson.css";

type AttStatus = "present" | "absent";
type HwField = "title" | "description" | "deadline";

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
        <button
          type="button"
          className="u-btn soft sm mt-2.5"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
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
  const { data: week } = useWeeklyAttendanceQuery(
    data?.lesson.groupId ?? "",
    data?.lesson.lessonDate,
  );

  const [homeworkForm, setHomeworkForm] = useState({
    title: "",
    description: "",
    maxScore: "100",
    deadline: "",
  });
  const [homeworkErrors, setHomeworkErrors] = useState<
    Partial<Record<HwField, string>>
  >({});
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

  const setHw =
    (key: keyof typeof homeworkForm) => (e: { target: { value: string } }) => {
      setHomeworkForm((f) => ({ ...f, [key]: e.target.value }));
      setHomeworkErrors((er) => ({ ...er, [key]: undefined }));
    };

  const handleCreateHomework = async () => {
    const errors: Partial<Record<HwField, string>> = {};
    if (!homeworkForm.title.trim()) errors.title = t("us.ld.errTitle");
    if (!homeworkForm.description.trim())
      errors.description = t("us.ld.errDesc");
    if (!homeworkForm.deadline) errors.deadline = t("us.lesson.needDue");
    setHomeworkErrors(errors);
    if (!id || Object.keys(errors).length > 0) return;
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
    if (data?.lesson.groupId)
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupDetail(data.lesson.groupId),
      });
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
        records: [
          { userId, status: status === "present" ? "PRESENT" : "ABSENT" },
        ],
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
    setOverrides((o) => ({
      ...o,
      ...Object.fromEntries(roster.map((s) => [s.id, "present" as const])),
    }));
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
        <div className="u-card">
          <div className="flex flex-wrap gap-2">
            <Skel className="h-8 w-28 rounded-full" />
            <Skel className="h-8 w-20 rounded-full" />
            <Skel className="h-8 w-24 rounded-full" />
          </div>
          <Skel className="mt-4 h-8 w-2/3 rounded-xl" />
          <Skel className="mt-2 h-4 w-1/2 rounded-lg" />
        </div>
        <div className="u-two e u-sec">
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="u-card grid gap-3">
              <Skel className="h-7 w-32 rounded-lg" />
              <Skel className="h-[60px] rounded-[18px]" />
              <Skel className="h-[60px] rounded-[18px]" />
              <Skel className="h-[60px] rounded-[18px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data || !data.lesson) {
    return (
      <EmptyBox
        tone="er"
        icon={AlertTriangle}
        title={
          error
            ? getErrorMessage(error, t("lessonDetail.notFound"))
            : t("lessonDetail.notFound")
        }
        action={
          error ? (
            <Button onClick={() => refetch()}>{t("common.retry")}</Button>
          ) : undefined
        }
      />
    );
  }

  const { lesson, homework } = data;
  const roster: LessonRosterEntry[] = data.roster ?? [];
  const statusOf = (s: LessonRosterEntry): AttStatus | null =>
    overrides[s.id] ?? s.attendanceStatus;
  const presentCount = roster.filter((s) => statusOf(s) === "present").length;
  const markedCount = roster.filter((s) => statusOf(s)).length;
  const submittedCount = roster.filter((s) => s.submission).length;
  const gradedCount = roster.filter(
    (s) => s.submission?.status === "graded",
  ).length;
  const toGradeCount = submittedCount - gradedCount;
  const nameOf = (s: LessonRosterEntry) => `${s.firstName} ${s.lastName}`;
  const avatarOf = (s: LessonRosterEntry) =>
    isImageUrl(s.avatar) ? s.avatar : null;
  const isLate = (s: LessonRosterEntry) =>
    !!homework &&
    !!s.submission?.submittedAt &&
    new Date(s.submission.submittedAt) > new Date(homework.deadline);
  const dueOver = homework ? new Date(homework.deadline) < new Date() : false;

  const offset = dayOffset(lesson.lessonDate);
  const status =
    lesson.status === "cancelled"
      ? { tone: "er" as const, text: t("us.ld.stCancelled") }
      : offset === 0
        ? { tone: "gd" as const, text: t("us.tl.secToday") }
        : offset > 0
          ? { tone: "pr" as const, text: t("us.ld.stUpcoming") }
          : { tone: "ok" as const, text: t("us.ld.stDone") };

  const toGrade = roster.filter(
    (s) => s.submission && s.submission.status !== "graded",
  );
  const graded = roster.filter((s) => s.submission?.status === "graded");
  const missing = roster.filter((s) => !s.submission);

  const subRow = (s: LessonRosterEntry) => {
    const sub = s.submission;
    return (
      <div key={s.id} className="u-row">
        <Avatar name={nameOf(s)} src={avatarOf(s)} seed={s.id} />
        <div className="g">
          <b className="truncate">{nameOf(s)}</b>
          <small className="flex flex-wrap items-center gap-x-1.5">
            {!sub
              ? dueOver
                ? t("us.ld.missed")
                : t("us.ld.notSubmitted")
              : sub.submittedAt
                ? formatDateTime(sub.submittedAt)
                : t("us.ld.awaiting")}
            {sub?.attachmentUrl && (
              <Paperclip
                className="u-i s"
                strokeWidth={2}
                aria-label={t("lessonDetail.attachmentLabel")}
              />
            )}
          </small>
          {isLate(s) && (
            <Tag className="u-late mt-1 !py-0.5 !text-[12px]">
              {t("us.ld.late")}
            </Tag>
          )}
        </div>
        {!sub ? (
          <Tag tone="mu">
            {dueOver ? t("us.ld.missedShort") : t("lessonDetail.waiting")}
          </Tag>
        ) : sub.status === "graded" ? (
          <button
            type="button"
            className="u-coin !text-base min-h-[44px]"
            onClick={() => setGradeId(sub.id)}
            aria-label={t("us.ld.editGrade", { name: nameOf(s) })}
          >
            {sub.score}/{homework?.maxScore}
          </button>
        ) : (
          <button
            type="button"
            className="u-btn sm min-h-[44px]"
            onClick={() => setGradeId(sub.id)}
          >
            {t("lessonDetail.gradeSubmit")}
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <BackButton
        to={`/groups/${lesson.groupId}`}
        label={lesson.groupName || undefined}
      />

      {/* Header */}
      <div className="u-card">
        <div className="u-lh-chips">
          <Tag tone={status.tone}>{status.text}</Tag>
          <span className="u-chip">
            <Hash className="u-i s" strokeWidth={2} aria-hidden="true" />
            {t("us.tl.lessonN", { n: lesson.lessonOrder })}
          </span>
          <span className="u-chip">
            <Calendar className="u-i s" strokeWidth={2} aria-hidden="true" />
            {formatDate(lesson.lessonDate)}
          </span>
          <span className="u-chip">
            <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />
            {formatTime(lesson.lessonDate)}
          </span>
          {lesson.teacherName && (
            <span className="u-chip">
              <User className="u-i s" strokeWidth={2} aria-hidden="true" />
              {lesson.teacherName}
            </span>
          )}
        </div>
        <h1 className="u-lh-title">{lesson.topic}</h1>
        {lesson.groupName && <p className="u-sub !mt-0">{lesson.groupName}</p>}
        {lesson.description && (
          <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed">
            {lesson.description}
          </p>
        )}
      </div>

      <div className="u-two e u-sec">
        {/* Attendance — each tap saves */}
        <section className="u-card" aria-labelledby="u-att-title">
          <SectionHead
            title={
              <span id="u-att-title">{t("lessonDetail.attendanceTitle")}</span>
            }
            right={
              <Tag
                tone={
                  presentCount === roster.length && presentCount > 0
                    ? "ok"
                    : "mu"
                }
              >
                {t("us.ld.came", { ok: presentCount, total: roster.length })}
              </Tag>
            }
          />
          {roster.length === 0 ? (
            <p className="u-sub">{t("us.ld.noStudents")}</p>
          ) : (
            <>
              <p className="u-hint mb-3">
                {markedCount < roster.length
                  ? t("us.ld.attHint", { n: roster.length - markedCount })
                  : t("us.ld.attDone")}
              </p>
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
                        {
                          value: "present",
                          label: t("us.ld.present"),
                          tone: "ok",
                        },
                        {
                          value: "absent",
                          label: t("us.ld.absent"),
                          tone: "er",
                        },
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
        </section>

        {/* Homework: task + submissions, or the form to give one */}
        <section className="u-card" aria-labelledby="u-hw-title">
          <SectionHead
            title={<span id="u-hw-title">{t("us.ld.hw")}</span>}
            right={
              homework ? (
                <Tag tone={dueOver ? "mu" : "er"}>
                  {t("us.ld.due", { date: formatDateTime(homework.deadline) })}
                </Tag>
              ) : undefined
            }
            className="flex-wrap"
          />

          {homework ? (
            <>
              <div className="u-hw-box">
                {homework.title && (
                  <p className="mb-2 font-bold break-words">{homework.title}</p>
                )}
                <HomeworkPaper text={homework.description} />
                <div className="u-chips mt-2.5">
                  <Tag tone="gd">
                    {t("us.ld.max", { n: homework.maxScore })}
                  </Tag>
                </div>
              </div>

              <div className="u-stat-strip mt-3">
                <div>
                  <b>
                    {submittedCount}/{roster.length}
                  </b>
                  <span>{t("us.ld.statSubmitted")}</span>
                </div>
                <div className={toGradeCount > 0 ? "gd" : undefined}>
                  <b>{toGradeCount}</b>
                  <span>{t("us.ld.statToGrade")}</span>
                </div>
                <div className={gradedCount > 0 ? "ok" : undefined}>
                  <b>{gradedCount}</b>
                  <span>{t("us.ld.statGraded")}</span>
                </div>
              </div>

              {roster.length === 0 ? (
                <p className="u-sub">{t("us.ld.noStudents")}</p>
              ) : (
                <>
                  {toGrade.length > 0 && (
                    <>
                      <h3 className="u-sub-group">{t("us.ld.grpToGrade")}</h3>
                      <div className="u-stack">{toGrade.map(subRow)}</div>
                    </>
                  )}
                  {graded.length > 0 && (
                    <>
                      <h3 className="u-sub-group">{t("us.ld.grpGraded")}</h3>
                      <div className="u-stack">{graded.map(subRow)}</div>
                    </>
                  )}
                  {missing.length > 0 && (
                    <>
                      <h3 className="u-sub-group">{t("us.ld.grpMissing")}</h3>
                      <div className="u-stack">{missing.map(subRow)}</div>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <p className="u-sub !mt-0">{t("us.ld.noHw")}</p>
              <form
                className="u-form-sec mt-3"
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateHomework();
                }}
              >
                <h3>
                  <PencilLine
                    className="u-i m"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {t("lessonDetail.addHomeworkTitle")}
                </h3>
                <p className="u-hint">{t("us.ld.addHwHint")}</p>
                <Input
                  type="text"
                  label={t("lessonDetail.homeworkTitleLabel")}
                  placeholder={t("us.ld.titlePh")}
                  value={homeworkForm.title}
                  onChange={setHw("title")}
                  error={homeworkErrors.title}
                  aria-invalid={!!homeworkErrors.title}
                  required
                />
                <Textarea
                  label={t("us.ld.descLabel")}
                  placeholder={t("us.ld.descPh")}
                  value={homeworkForm.description}
                  onChange={setHw("description")}
                  error={homeworkErrors.description}
                  aria-invalid={!!homeworkErrors.description}
                  rows={5}
                  required
                />
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[140px_1fr]">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    label={t("lessonDetail.maxScoreLabel")}
                    value={homeworkForm.maxScore}
                    onChange={setHw("maxScore")}
                  />
                  <Input
                    type="datetime-local"
                    label={t("lessonDetail.deadlineFormLabel")}
                    value={homeworkForm.deadline}
                    onChange={setHw("deadline")}
                    error={homeworkErrors.deadline}
                    aria-invalid={!!homeworkErrors.deadline}
                    required
                  />
                </div>
                <p className="u-hint !mt-[-6px]">{t("us.ld.dueHint")}</p>
                <Button type="submit" isLoading={isSavingHomework} fullWidth>
                  {t("lessonDetail.createHomework")}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>

      <section className="u-sec">
        <SectionHead title={t("us.ld.weekly")} />
        <WeeklyAttendanceTable
          groupId={lesson.groupId}
          referenceDate={lesson.lessonDate}
        />
      </section>

      <GradeSheet submissionId={gradeId} onClose={() => setGradeId(null)} />
    </div>
  );
};
