// src/teacher/components/sheets.tsx
// Sheets used from several teacher pages (mock `form(...)` modals):
// grading a submission, adding a lesson (+ homework) and giving coins.
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Clock,
  Coins,
  Download,
  Paperclip,
  PencilLine,
  BookOpen,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Modal } from "@/components/common/Modal";
import { Button, Input, Select, Textarea, DateTimeField } from "@/components/ui";
import {
  useSubmissionDetailQuery,
  useGradeSubmissionMutation,
} from "@/hooks/queries/useSubmissions";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { useAwardCoinsMutation } from "@/hooks/queries/useCoins";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Skel, Tag } from "./ui";
import { formatDateTime } from "@/utilist/formatData";
import "../theme/lesson.css";

/**
 * A submission's file: images get a preview; data: URLs can't open in a new
 * tab, so they download, other links open in a new tab.
 */
export const SubmissionAttachment = ({ url }: { url: string }) => {
  const { t } = useTranslation();
  const isData = url.startsWith("data:");
  const mime = isData ? url.slice(5, url.indexOf(";")) : "";
  const ext = mime.split("/")[1]?.split("+")[0] || "bin";
  const isImage =
    mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
  return (
    <div className="u-attach">
      {isImage && (
        <img src={url} alt={t("lessonDetail.attachmentLabel")} loading="lazy" />
      )}
      <a
        href={url}
        className="u-chip !bg-u-prt !text-u-pr"
        {...(isData
          ? { download: `attachment.${ext}` }
          : { target: "_blank", rel: "noopener noreferrer" })}
      >
        {isData ? (
          <Download className="u-i s" strokeWidth={2} aria-hidden="true" />
        ) : (
          <Paperclip className="u-i s" strokeWidth={2} aria-hidden="true" />
        )}
        {isData ? t("us.grade.download") : t("lessonDetail.attachmentLabel")}
      </a>
    </div>
  );
};

/** Late = handed in after the deadline (possible when the deadline was moved). */
export const isLateSubmission = (
  submittedAt?: string | null,
  deadline?: string | null,
) => !!submittedAt && !!deadline && new Date(submittedAt) > new Date(deadline);

// ── Grade ──

const FEEDBACK_KEYS = [
  "us.grade.fbGreat",
  "us.grade.fbGood",
  "us.grade.fbRetry",
] as const;

/**
 * Grade one submission: who / what / when, the answer (+ file), quick
 * scores, score, feedback chips + free text. With `onNext` (grading queue)
 * a "Save & next" button opens the next submission right away.
 */
export const GradeSheet = ({
  submissionId,
  onClose,
  onNext,
}: {
  submissionId: string | null;
  onClose: () => void;
  onNext?: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: submission, isLoading } = useSubmissionDetailQuery(
    submissionId ?? undefined,
  );
  const grade = useGradeSubmissionMutation();
  const [score, setScore] = useState("");
  const [chips, setChips] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const feedbackOptions = FEEDBACK_KEYS.map((key) => t(key));
  const max = submission?.homework.maxScore ?? 100;

  useEffect(() => {
    if (!submission) return;
    setScore(submission.score !== null ? String(submission.score) : "");
    // Previously saved feedback: split known chips back out, keep the rest as text.
    const parts = (submission.feedback ?? "").split(/\s*·\s*/).filter(Boolean);
    setChips(parts.filter((p) => feedbackOptions.includes(p)));
    setNote(parts.filter((p) => !feedbackOptions.includes(p)).join(" · "));
    setError(null);
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

  const save = async (next = false) => {
    if (!submissionId || !submission) return;
    const value = Number(score);
    if (score === "" || !Number.isFinite(value) || value < 0 || value > max) {
      setError(t("us.grade.scoreRange", { max }));
      return;
    }
    const feedback = [...chips, note.trim()].filter(Boolean).join(" · ");
    try {
      await grade.mutateAsync({
        id: submissionId,
        payload: { score: Math.round(value), feedback: feedback || undefined },
      });
      // Grades show up on the lesson, the student page and the dashboard counter.
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
      if (next && onNext) onNext();
      else onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("common.error")));
    }
  };

  const title = submission
    ? `${submission.student.firstName} ${submission.student.lastName}`
    : t("lessonDetail.gradeSubmit");
  const late = submission
    ? isLateSubmission(submission.submittedAt, submission.homework.deadline)
    : false;

  return (
    <Modal isOpen={!!submissionId} onClose={onClose} title={title}>
      {isLoading || !submission ? (
        <div className="grid gap-3" aria-busy="true">
          <Skel className="h-20" />
          <Skel className="h-28" />
          <Skel className="h-12" />
          <Skel className="h-12" />
        </div>
      ) : (
        <form
          className="grid gap-3.5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
        >
          <div className="u-grade-info">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-u-mu">
              <BookOpen className="u-i s" strokeWidth={2} aria-hidden="true" />
              <span className="min-w-0 break-words">
                {submission.lesson.topic} · {submission.lesson.groupName}
              </span>
            </span>
            {submission.homework.title &&
              submission.homework.title !== submission.lesson.topic && (
                <b className="flex items-center gap-1.5">
                  <PencilLine
                    className="u-i s flex-none"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {submission.homework.title}
                </b>
              )}
            <div className="u-gq-meta !mt-0">
              <Tag tone="mu">
                <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />
                {t("us.gq.submittedAt", {
                  date: formatDateTime(submission.submittedAt),
                })}
              </Tag>
              {late && <Tag className="u-late">{t("us.ld.late")}</Tag>}
              <Tag tone="mu">
                <Calendar
                  className="u-i s"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {t("us.ld.due", {
                  date: formatDateTime(submission.homework.deadline),
                })}
              </Tag>
            </div>
          </div>
          <div>
            <p className="u-sub !mt-0 mb-1.5 font-bold">
              {t("us.grade.answer")}
            </p>
            <div className="u-paper full">
              {submission.content || t("us.grade.noAnswer")}
            </div>
            {submission.attachmentUrl && (
              <SubmissionAttachment url={submission.attachmentUrl} />
            )}
          </div>
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
                    setError(null);
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="u-score-in">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={max}
              label={t("us.grade.scoreOf", { max })}
              value={score}
              aria-invalid={!!error}
              onChange={(e) => {
                setScore(e.target.value);
                setError(null);
              }}
            />
            <span className="u-of" aria-hidden="true">
              / {max}
            </span>
          </div>
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
            placeholder={t("us.grade.notePh")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[72px]"
            maxLength={4000}
          />
          {error && (
            <p className="text-[13px] font-bold text-u-er" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            {onNext ? (
              <>
                <Button
                  type="submit"
                  variant="outline"
                  className="flex-1"
                  isLoading={grade.isPending}
                >
                  {t("us.grade.save")}
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => save(true)}
                  isLoading={grade.isPending}
                >
                  {t("us.grade.saveNext")}
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                className="flex-1"
                isLoading={grade.isPending}
              >
                {t("us.grade.save")}
              </Button>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};

// ── Add lesson ──

const nowLocal = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

/**
 * New lesson with optional homework in one sheet (mock "Yangi dars").
 * Without `groupId` the teacher picks one of the active groups.
 */
export const AddLessonSheet = ({
  open,
  onClose,
  groupId,
  lessonDate,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  groupId?: string;
  /** Prefilled start ("YYYY-MM-DDTHH:mm", local), e.g. the group's scheduled time today. */
  lessonDate?: string;
  onCreated?: (lessonId: string) => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: groups } = useGroupsQuery();
  const activeGroups = (groups ?? []).filter((g) => g.status === "active");
  const [form, setForm] = useState({
    groupId: "",
    topic: "",
    description: "",
    lessonDate: "",
    hw: "",
    due: "",
    max: "100",
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"topic" | "lessonDate" | "due", string>>
  >({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      groupId: groupId ?? "",
      topic: "",
      description: "",
      lessonDate: lessonDate ?? nowLocal(),
      hw: "",
      due: "",
      max: "100",
    });
    setError(null);
    setFieldErrors({});
  }, [open, groupId, lessonDate]);

  const targetGroup = groupId ?? (form.groupId || activeGroups[0]?.id || "");
  const set =
    (key: keyof typeof form) => (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setError(null);
      setFieldErrors((fe) => ({ ...fe, [key]: undefined }));
    };

  const submit = async () => {
    if (!targetGroup) return setError(t("us.lesson.noGroups"));
    const hw = form.hw.trim();
    const errors: typeof fieldErrors = {};
    if (!form.topic.trim()) errors.topic = t("us.lesson.errTopic");
    if (!form.lessonDate) errors.lessonDate = t("us.lesson.errDate");
    if (hw && !form.due) errors.due = t("us.lesson.needDue");
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      const lesson = await teacherService.createLesson(targetGroup, {
        topic: form.topic.trim(),
        description: form.description.trim() || undefined,
        lessonDate: form.lessonDate,
      });
      const lessonId = (lesson as { id?: string } | undefined)?.id;
      if (hw && lessonId) {
        try {
          await teacherService.createHomework(lessonId, {
            title: form.topic.trim(),
            description: hw,
            maxScore: Number(form.max) > 0 ? Number(form.max) : undefined,
            deadline: form.due,
          });
        } catch {
          toast.warning(t("us.lesson.hwFailed"));
        }
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.groupDetail(targetGroup),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (lessonId)
        queryClient.invalidateQueries({ queryKey: queryKeys.lesson(lessonId) });
      toast.success(t("us.lesson.added"));
      onClose();
      if (lessonId) onCreated?.(lessonId);
    } catch (err) {
      setError(getErrorMessage(err, t("common.error")));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={t("us.lesson.new")}>
      <form
        className="grid gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <fieldset className="u-form-sec">
          <legend className="sr-only">{t("us.lesson.secLesson")}</legend>
          <h3 aria-hidden="true">
            <span className="u-step">1</span>
            {t("us.lesson.secLesson")}
          </h3>
          {!groupId && (
            <Select
              label={t("us.lesson.group")}
              value={targetGroup}
              onChange={set("groupId")}
            >
              {activeGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          )}
          <Input
            label={t("groupDetail.lessonTopic")}
            placeholder={t("us.lesson.topicPh")}
            value={form.topic}
            onChange={set("topic")}
            error={fieldErrors.topic}
            aria-invalid={!!fieldErrors.topic}
            required
          />
          <DateTimeField
            label={t("us.lesson.dateTime")}
            value={form.lessonDate}
            onChange={set("lessonDate")}
            error={fieldErrors.lessonDate}
            aria-invalid={!!fieldErrors.lessonDate}
            required
          />
          <Textarea
            label={t("us.lesson.descOptional")}
            placeholder={t("us.lesson.descPh")}
            value={form.description}
            onChange={set("description")}
            className="min-h-[64px]"
          />
        </fieldset>

        <fieldset className="u-form-sec">
          <legend className="sr-only">{t("us.lesson.secHw")}</legend>
          <h3 aria-hidden="true">
            <span className="u-step">2</span>
            {t("us.lesson.secHw")}
          </h3>
          <p className="u-hint">{t("us.lesson.hwHint")}</p>
          <Textarea
            label={t("us.lesson.hw")}
            placeholder={t("us.lesson.hwPh")}
            value={form.hw}
            onChange={set("hw")}
            rows={4}
          />
          {form.hw.trim() && (
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3.5">
              <DateTimeField
                defaultTime="20:00"
                label={t("us.lesson.due")}
                value={form.due}
                onChange={set("due")}
                error={fieldErrors.due}
                aria-invalid={!!fieldErrors.due}
                required
              />
              <Input
                label={t("us.lesson.max")}
                type="number"
                inputMode="numeric"
                min={1}
                value={form.max}
                onChange={set("max")}
              />
            </div>
          )}
        </fieldset>

        {error && (
          <p className="text-[13px] font-bold text-u-er" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" className="flex-1" isLoading={saving}>
            {t("groupDetail.addLesson")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// ── Give coins ──

export const COIN_REASON_KEYS = [
  "us.coin.r1",
  "us.coin.r2",
  "us.coin.r3",
  "us.coin.r4",
  "us.coin.r5",
] as const;

/** Give (or take) coins; `studentId` fixes the student (student page), else pick one. */
export const GiveCoinSheet = ({
  open,
  onClose,
  studentId,
}: {
  open: boolean;
  onClose: () => void;
  studentId?: string;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: students } = useStudentsQuery();
  const award = useAwardCoinsMutation();
  const [form, setForm] = useState({ studentId: "", amount: "5", reason: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      studentId: studentId ?? "",
      amount: "5",
      reason: t(COIN_REASON_KEYS[0]),
    });
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  const target = studentId ?? form.studentId;
  const student = students?.find((s) => s.id === target);

  const submit = async () => {
    const amount = Math.trunc(Number(form.amount));
    if (!target || !amount || !form.reason.trim())
      return setError(t("us.fillRequired"));
    try {
      await award.mutateAsync({
        studentId: target,
        amount,
        reason: form.reason.trim(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.studentDetail(target),
      });
      const name = student ? `${student.firstName} ${student.lastName}` : "";
      toast.success(
        amount > 0
          ? t("us.coin.given", { name, n: amount })
          : t("us.coin.taken", { name, n: -amount }),
      );
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("common.error")));
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={t("us.coin.title")}>
      <div className="grid gap-3.5">
        <Select
          label={t("us.coin.student")}
          value={target}
          disabled={!!studentId}
          onChange={(e) =>
            setForm((f) => ({ ...f, studentId: e.target.value }))
          }
        >
          {!studentId && <option value="">—</option>}
          {(students ?? [])
            .filter((s) => !studentId || s.id === studentId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName}
              </option>
            ))}
        </Select>
        <Input
          label={t("us.coin.amount")}
          type="number"
          inputMode="numeric"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          leftIcon={<Coins className="w-[18px] h-[18px]" />}
        />
        <Select
          label={t("us.coin.reason")}
          value={form.reason}
          onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
        >
          {COIN_REASON_KEYS.map((key) => (
            <option key={key} value={t(key)}>
              {t(key)}
            </option>
          ))}
        </Select>
        {error && <p className="text-[13px] font-bold text-u-er">{error}</p>}
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            className="flex-1"
            onClick={submit}
            isLoading={award.isPending}
          >
            {t("us.coin.give")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
