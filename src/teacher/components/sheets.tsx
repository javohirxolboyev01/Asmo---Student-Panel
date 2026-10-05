// src/teacher/components/sheets.tsx
// Sheets used from several teacher pages (mock `form(...)` modals):
// grading a submission, adding a lesson (+ homework) and giving coins.
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Paperclip } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Modal } from "@/components/common/Modal";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { useSubmissionDetailQuery, useGradeSubmissionMutation } from "@/hooks/queries/useSubmissions";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { useAwardCoinsMutation } from "@/hooks/queries/useCoins";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Skel } from "./ui";

// ── Grade ──

const FEEDBACK_KEYS = ["us.grade.fbGreat", "us.grade.fbGood", "us.grade.fbRetry"] as const;

/** Grade one submission: answer, quick scores, score, feedback chips + free text. */
export const GradeSheet = ({ submissionId, onClose }: { submissionId: string | null; onClose: () => void }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: submission, isLoading } = useSubmissionDetailQuery(submissionId ?? undefined);
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
    () => [...new Set([50, 60, 70, 80, 90, 100].map((p) => Math.round((max * p) / 100)))],
    [max],
  );

  const save = async () => {
    if (!submissionId || !submission) return;
    const value = Number(score);
    if (score === "" || !Number.isFinite(value) || value < 0 || value > max) {
      setError(t("us.grade.scoreRange", { max }));
      return;
    }
    const feedback = [...chips, note.trim()].filter(Boolean).join(" · ");
    try {
      await grade.mutateAsync({ id: submissionId, payload: { score: Math.round(value), feedback: feedback || undefined } });
      // Grades show up on the lesson, the student page and the dashboard counter.
      queryClient.invalidateQueries({ queryKey: queryKeys.lesson(submission.lesson.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentDetail(submission.student.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetail(submission.lesson.groupId) });
      toast.success(t("us.grade.saved"));
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("common.error")));
    }
  };

  const title = submission
    ? `${submission.student.firstName} ${submission.student.lastName} — ${submission.lesson.topic}`
    : t("lessonDetail.gradeSubmit");

  return (
    <Modal isOpen={!!submissionId} onClose={onClose} title={title}>
      {isLoading || !submission ? (
        <div className="grid gap-3">
          <Skel className="h-28" />
          <Skel className="h-12" />
          <Skel className="h-12" />
        </div>
      ) : (
        <div className="grid gap-3.5">
          <div>
            <p className="u-sub !mt-0 mb-1.5 font-bold">{t("us.grade.answer")}</p>
            <div className="u-paper full">{submission.content || t("us.grade.noAnswer")}</div>
            {submission.attachmentUrl && (
              <a
                href={submission.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="u-chip mt-2.5 !text-u-pr !bg-u-prt"
              >
                <Paperclip className="u-i s" aria-hidden="true" />
                {t("lessonDetail.attachmentLabel")}
              </a>
            )}
          </div>
          <div>
            <p className="u-sub !mt-0 mb-2 font-bold">{t("us.grade.quick")}</p>
            <div className="u-chips">
              {presets.map((v) => (
                <button
                  key={v}
                  type="button"
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
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={max}
            label={t("us.grade.scoreOf", { max })}
            value={score}
            onChange={(e) => {
              setScore(e.target.value);
              setError(null);
            }}
          />
          <div className="u-tg" role="group" aria-label={t("lessonDetail.feedbackLabel")}>
            {feedbackOptions.map((option) => {
              const on = chips.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={on}
                  className={on ? "on" : undefined}
                  onClick={() => setChips((prev) => (on ? prev.filter((c) => c !== option) : [...prev, option]))}
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
            className="min-h-[72px]"
            maxLength={4000}
          />
          {error && <p className="text-[13px] font-bold text-u-er">{error}</p>}
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1" onClick={save} isLoading={grade.isPending}>
              {t("us.grade.save")}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ── Add lesson ──

const nowLocal = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

/**
 * New lesson with optional homework in one sheet (mock "Yangi dars").
 * Without `groupId` the teacher picks one of the active groups.
 */
export const AddLessonSheet = ({
  open,
  onClose,
  groupId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  groupId?: string;
  onCreated?: (lessonId: string) => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: groups } = useGroupsQuery();
  const activeGroups = (groups ?? []).filter((g) => g.status === "active");
  const [form, setForm] = useState({ groupId: "", topic: "", description: "", lessonDate: "", hw: "", due: "", max: "100" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({ groupId: groupId ?? "", topic: "", description: "", lessonDate: nowLocal(), hw: "", due: "", max: "100" });
    setError(null);
  }, [open, groupId]);

  const targetGroup = groupId ?? (form.groupId || activeGroups[0]?.id || "");
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setError(null);
  };

  const submit = async () => {
    if (!targetGroup) return setError(t("us.lesson.noGroups"));
    if (!form.topic.trim() || !form.lessonDate) return setError(t("us.fillRequired"));
    const hw = form.hw.trim();
    if (hw && !form.due) return setError(t("us.lesson.needDue"));
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
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetail(targetGroup) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      if (lessonId) queryClient.invalidateQueries({ queryKey: queryKeys.lesson(lessonId) });
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
      <div className="grid gap-3.5">
        {!groupId && (
          <Select label={t("us.lesson.group")} value={targetGroup} onChange={set("groupId")}>
            {activeGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        )}
        <Input label={t("groupDetail.lessonTopic")} value={form.topic} onChange={set("topic")} required />
        <Input label={t("us.lesson.date")} type="datetime-local" value={form.lessonDate} onChange={set("lessonDate")} required />
        <Textarea
          label={t("groupDetail.lessonDescription")}
          value={form.description}
          onChange={set("description")}
          className="min-h-[64px]"
        />
        <Textarea
          label={t("us.lesson.hw")}
          placeholder={t("us.lesson.hwHint")}
          value={form.hw}
          onChange={set("hw")}
          rows={5}
        />
        {form.hw.trim() && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3.5">
            <Input label={t("us.lesson.due")} type="datetime-local" value={form.due} onChange={set("due")} />
            <Input label={t("us.lesson.max")} type="number" min={1} value={form.max} onChange={set("max")} />
          </div>
        )}
        {error && <p className="text-[13px] font-bold text-u-er">{error}</p>}
        <div className="flex gap-2.5">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button className="flex-1" onClick={submit} isLoading={saving}>
            {t("groupDetail.addLesson")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// ── Give coins ──

export const COIN_REASON_KEYS = ["us.coin.r1", "us.coin.r2", "us.coin.r3", "us.coin.r4", "us.coin.r5"] as const;

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
    setForm({ studentId: studentId ?? "", amount: "5", reason: t(COIN_REASON_KEYS[0]) });
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, studentId]);

  const target = studentId ?? form.studentId;
  const student = students?.find((s) => s.id === target);

  const submit = async () => {
    const amount = Math.trunc(Number(form.amount));
    if (!target || !amount || !form.reason.trim()) return setError(t("us.fillRequired"));
    try {
      await award.mutateAsync({ studentId: target, amount, reason: form.reason.trim() });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentDetail(target) });
      const name = student ? `${student.firstName} ${student.lastName}` : "";
      toast.success(amount > 0 ? t("us.coin.given", { name, n: amount }) : t("us.coin.taken", { name, n: -amount }));
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
          onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
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
          <Button className="flex-1" onClick={submit} isLoading={award.isPending}>
            {t("us.coin.give")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
