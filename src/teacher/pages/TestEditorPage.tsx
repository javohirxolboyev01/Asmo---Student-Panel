// src/teacher/pages/TestEditorPage.tsx
// Test yaratish / tahrirlash. Savollar bittalab qo'shiladi yoki tayyor matndan
// (masalan, AI tuzib bergan) bir yo'la import qilinadi — format: lib/quizParser.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowDown, ArrowUp, ChevronLeft, ClipboardCopy, Lock, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useQuizDetailQuery, useSaveQuizMutation } from "@/hooks/queries/useQuizzes";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { useGoBack } from "@/hooks/useNavigationHistory";
import { MAX_OPTIONS, parseQuizText, quizAiPrompt } from "@/lib/quizParser";
import type { QuizInput, QuizQuestionInput } from "@/types/quiz";
import { Modal } from "@/components/common/Modal";
import { SkeletonHeader, SkeletonCard } from "@/components/common/Skeleton";
import { Button, Checkbox, IconButton, Input, Select, Textarea } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettingsStore } from "@/stores/settingsStore";

const MAX_QUESTIONS = 100;
const LETTERS = "ABCDEF";

// Local ids keep React keys stable while questions are moved/removed.
type DraftQuestion = QuizQuestionInput & { key: string };
let keySeq = 0;
const draft = (q: QuizQuestionInput): DraftQuestion => ({ ...q, key: `q${++keySeq}` });
const emptyQuestion = () => draft({ text: "", options: ["", "", "", ""], correctIndex: -1 });

interface MetaForm {
  title: string;
  description: string;
  groupId: string; // "" = barcha talabalar
  timeLimit: string; // "" = cheklovsiz
  isActive: boolean;
}

const EMPTY_META: MetaForm = { title: "", description: "", groupId: "", timeLimit: "", isActive: true };

/** i18n key of the first problem in a question, or null. */
const questionProblem = (q: QuizQuestionInput) => {
  if (!q.text.trim()) return "quizzes.error.questionText";
  const filled = q.options.filter((o) => o.trim());
  if (filled.length < 2 || filled.length !== q.options.length) return "quizzes.error.options";
  if (q.correctIndex < 0 || q.correctIndex >= q.options.length) return "quizzes.error.correct";
  return null;
};

/** Keyed by id: /tests/new ↔ /tests/:id/edit must never share form state. */
export const TestEditorPage = () => {
  const { id } = useParams<{ id: string }>();
  return <TestEditor key={id ?? "new"} id={id} />;
};

const TestEditor = ({ id }: { id: string | undefined }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useGoBack("/tests");
  const language = useSettingsStore((s) => s.language);
  const { data, isFetchedAfterMount, isLoading, isError, error, refetch } = useQuizDetailQuery(id);
  // Only a copy fetched for this visit fills the form.
  const existing = isFetchedAfterMount ? data : undefined;
  const { data: groups = [] } = useGroupsQuery();
  const save = useSaveQuizMutation();

  const [meta, setMeta] = useState<MetaForm>(EMPTY_META);
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => (id ? [] : [emptyQuestion()]));
  const [showErrors, setShowErrors] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Fill the form once per loaded test, so a background refetch never wipes edits.
  useEffect(() => {
    if (!existing || loadedId === existing.id) return;
    setLoadedId(existing.id);
    setMeta({
      title: existing.title,
      description: existing.description ?? "",
      groupId: existing.groupId ?? "",
      timeLimit: existing.timeLimitMin ? String(existing.timeLimitMin) : "",
      isActive: existing.isActive,
    });
    setQuestions(existing.questions.map(draft));
  }, [existing, loadedId]);

  // Scores already given only make sense for the questions they were given on.
  const locked = Boolean(existing && existing.attemptCount > 0);
  const parsed = useMemo(() => parseQuizText(importText), [importText]);
  const parsedValid = parsed.filter((q) => q.errors.length === 0);

  const updateQuestion = (key: string, patch: Partial<QuizQuestionInput>) =>
    setQuestions((qs) => qs.map((q) => (q.key === key ? { ...q, ...patch } : q)));

  const move = (index: number, delta: number) =>
    setQuestions((qs) => {
      const next = [...qs];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const setOption = (q: DraftQuestion, i: number, value: string) =>
    updateQuestion(q.key, { options: q.options.map((o, j) => (j === i ? value : o)) });

  const removeOption = (q: DraftQuestion, i: number) =>
    updateQuestion(q.key, {
      options: q.options.filter((_, j) => j !== i),
      correctIndex: q.correctIndex === i ? -1 : q.correctIndex > i ? q.correctIndex - 1 : q.correctIndex,
    });

  const addImported = () => {
    const room = MAX_QUESTIONS - questions.length;
    const added = parsedValid.slice(0, room).map(({ text, options, correctIndex }) => draft({ text, options, correctIndex }));
    // Drop the untouched blank question a new test starts with.
    setQuestions((qs) => [...qs.filter((q) => q.text.trim() || q.options.some((o) => o.trim())), ...added]);
    setImportOpen(false);
    setImportText("");
    toast.success(t("quizzes.import.added", { count: added.length }));
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(quizAiPrompt(language));
      toast.success(t("quizzes.import.promptCopied"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const titleError = !meta.title.trim() || meta.title.trim().length > 120 ? t("quizzes.error.title") : undefined;
  const limit = Number(meta.timeLimit);
  const limitError =
    meta.timeLimit.trim() && !(Number.isInteger(limit) && limit >= 1 && limit <= 180) ? t("quizzes.error.timeLimit") : undefined;
  const problems = questions.map(questionProblem);
  const hasErrors = Boolean(titleError || limitError || questions.length === 0 || problems.some(Boolean));

  const handleSave = async () => {
    setShowErrors(true);
    if (hasErrors) {
      toast.error(questions.length === 0 ? t("quizzes.error.noQuestions") : t("quizzes.error.fix"));
      return;
    }
    const input: QuizInput = {
      title: meta.title.trim(),
      description: meta.description.trim() || null,
      groupId: meta.groupId || null,
      timeLimitMin: meta.timeLimit.trim() ? limit : null,
      isActive: meta.isActive,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        options: q.options.map((o) => o.trim()),
        correctIndex: q.correctIndex,
      })),
    };
    try {
      await save.mutateAsync({ id, input });
      toast.success(id ? t("common.updateSuccess") : t("common.createSuccess"));
      // replace: the back gesture shouldn't reopen the editor that was just saved.
      navigate("/tests", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (id && (isLoading || (!existing && !isError))) {
    return (
      <div className="space-y-4">
        <SkeletonHeader />
        <SkeletonCard lines={3} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (id && isError) {
    return (
      <div className="card p-5 text-center space-y-3">
        <p className="text-red-500">{getErrorMessage(error, t("quizzes.loadError"))}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5 pb-20 md:pb-24">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-warning"
      >
        <ChevronLeft className="w-4 h-4" />
        {t("common.back")}
      </button>

      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
          {id ? t("quizzes.edit") : t("quizzes.create")}
        </h1>
        <p className="text-gray-500 text-sm md:text-base">{t("quizzes.editorHint")}</p>
      </div>

      <div className="card p-4 md:p-5 space-y-3">
        <Input
          label={t("quizzes.field.title")}
          placeholder={t("quizzes.field.titlePlaceholder")}
          value={meta.title}
          maxLength={120}
          onChange={(e) => setMeta({ ...meta, title: e.target.value })}
          error={showErrors ? titleError : undefined}
        />
        <Textarea
          label={t("quizzes.field.description")}
          value={meta.description}
          maxLength={500}
          onChange={(e) => setMeta({ ...meta, description: e.target.value })}
          className="min-h-[70px]"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label={t("missions.field.group")}
            value={meta.groupId}
            onChange={(e) => setMeta({ ...meta, groupId: e.target.value })}
          >
            <option value="">{t("missions.allStudents")}</option>
            {meta.groupId && !groups.some((g) => g.id === meta.groupId) && <option value={meta.groupId}>—</option>}
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Input
            label={t("quizzes.field.timeLimit")}
            type="number"
            min={1}
            max={180}
            placeholder={t("quizzes.noLimit")}
            value={meta.timeLimit}
            onChange={(e) => setMeta({ ...meta, timeLimit: e.target.value })}
            error={limitError}
          />
        </div>
        <Checkbox
          checked={meta.isActive}
          onChange={(e) => setMeta({ ...meta, isActive: e.target.checked })}
          label={t("missions.field.isActive")}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">
          {t("quizzes.questions")} <span className="text-gray-400 font-normal">({questions.length})</span>
        </h2>
        {!locked && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={() => setImportOpen(true)}
              disabled={questions.length >= MAX_QUESTIONS}
            >
              {t("quizzes.import.open")}
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
              disabled={questions.length >= MAX_QUESTIONS}
            >
              {t("quizzes.addQuestion")}
            </Button>
          </div>
        )}
      </div>

      {locked && (
        <div className="card p-3 md:p-4 flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300 border border-warning/40">
          <Lock className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
          {t("quizzes.locked", { count: existing?.attemptCount ?? 0 })}
        </div>
      )}

      {questions.length === 0 && (
        <div className="card p-6 text-center text-sm text-gray-500">{t("quizzes.noQuestionsYet")}</div>
      )}

      {questions.map((q, index) => {
        const problem = showErrors ? problems[index] : null;
        return (
          <div key={q.key} className={cn("card p-4 md:p-5 space-y-3", problem && "ring-1 ring-red-400")}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-warning">
                {t("quizzes.questionN", { n: index + 1 })}
              </span>
              {!locked && (
                <div className="flex items-center gap-1">
                  <IconButton size="sm" onClick={() => move(index, -1)} disabled={index === 0} aria-label={t("quizzes.moveUp")}>
                    <ArrowUp className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    size="sm"
                    onClick={() => move(index, 1)}
                    disabled={index === questions.length - 1}
                    aria-label={t("quizzes.moveDown")}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="danger"
                    onClick={() => setQuestions((qs) => qs.filter((x) => x.key !== q.key))}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              )}
            </div>

            <Textarea
              value={q.text}
              placeholder={t("quizzes.field.question")}
              maxLength={1000}
              disabled={locked}
              onChange={(e) => updateQuestion(q.key, { text: e.target.value })}
              className="min-h-[60px]"
            />

            <div className="space-y-2" role="radiogroup" aria-label={t("quizzes.field.correct")}>
              {q.options.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={q.correctIndex === i}
                    aria-label={t("quizzes.markCorrect", { letter: LETTERS[i] })}
                    disabled={locked}
                    onClick={() => updateQuestion(q.key, { correctIndex: i })}
                    className={cn(
                      "w-8 h-8 rounded-full flex-shrink-0 text-xs font-bold border-2 transition-colors",
                      q.correctIndex === i
                        ? "bg-[#2E7D32] border-[#2E7D32] text-white"
                        : "border-gray-200 dark:border-gray-700 text-gray-500 hover:border-[#2E7D32]",
                    )}
                  >
                    {LETTERS[i]}
                  </button>
                  <div className="flex-1 min-w-0">
                    <Input
                      value={option}
                      maxLength={300}
                      disabled={locked}
                      placeholder={t("quizzes.field.option", { letter: LETTERS[i] })}
                      onChange={(e) => setOption(q, i, e.target.value)}
                    />
                  </div>
                  {!locked && q.options.length > 2 && (
                    <IconButton size="sm" onClick={() => removeOption(q, i)} aria-label={t("quizzes.removeOption")}>
                      <X className="w-4 h-4" />
                    </IconButton>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              {!locked && q.options.length < MAX_OPTIONS ? (
                <button
                  type="button"
                  onClick={() => updateQuestion(q.key, { options: [...q.options, ""] })}
                  className="text-sm text-warning hover:underline"
                >
                  + {t("quizzes.addOption")}
                </button>
              ) : (
                <span />
              )}
              <span className={cn("text-xs", problem ? "text-red-500" : "text-gray-400")}>
                {problem ? t(problem) : t("quizzes.correctHint")}
              </span>
            </div>
          </div>
        );
      })}

      {/* Sits above the mobile tab bar (49px + safe area), bottom-right on desktop. */}
      <div className="fixed bottom-[calc(49px+env(safe-area-inset-bottom,0px))] inset-x-0 z-30 md:left-auto md:right-6 md:bottom-6 md:inset-x-auto p-3 md:p-0 bg-white/90 dark:bg-card-dark/90 md:bg-transparent md:dark:bg-transparent backdrop-blur md:backdrop-blur-0 border-t md:border-0 border-gray-100 dark:border-gray-800">
        <Button onClick={handleSave} isLoading={save.isPending} fullWidth className="md:w-auto md:px-8 md:shadow-lg">
          {id ? t("common.update") : t("common.create")}
        </Button>
      </div>

      <Modal isOpen={importOpen} onClose={() => setImportOpen(false)} title={t("quizzes.import.title")} maxWidth="max-w-2xl">
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("quizzes.import.hint")}</p>
          <div className="rounded-xl bg-gray-50 dark:bg-white/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{t("quizzes.import.format")}</span>
              <Button size="sm" variant="outline" leftIcon={<ClipboardCopy className="w-4 h-4" />} onClick={copyPrompt}>
                {t("quizzes.import.copyPrompt")}
              </Button>
            </div>
            <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">
              {"1. Savol matni?\nA) Variant\nB) Variant\nC) Variant\nD) Variant\nJavob: B"}
            </pre>
          </div>
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t("quizzes.import.placeholder")}
            className="min-h-[220px] font-mono text-sm"
          />
          {importText.trim() && (
            <div className="text-sm space-y-1.5">
              <p className="text-gray-700 dark:text-gray-200">
                {t("quizzes.import.found", { count: parsed.length, valid: parsedValid.length })}
              </p>
              {parsed.some((q) => q.errors.length > 0) && (
                <ul className="text-xs text-red-500 space-y-0.5 max-h-28 overflow-y-auto">
                  {parsed.map((q, i) =>
                    q.errors.length ? (
                      <li key={i}>
                        {i + 1}. «{q.text.slice(0, 50)}» — {q.errors.map((e) => t(e)).join(", ")}
                      </li>
                    ) : null,
                  )}
                </ul>
              )}
            </div>
          )}
          <Button onClick={addImported} disabled={parsedValid.length === 0} fullWidth>
            {t("quizzes.import.add", { count: parsedValid.length })}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
