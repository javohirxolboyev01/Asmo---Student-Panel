// src/teacher/pages/TestEditorPage.tsx
// Test yaratish / tahrirlash. Savollar bittalab qo'shiladi yoki tayyor matndan
// (masalan, AI tuzib bergan) bir yo'la import qilinadi — format: lib/quizParser.
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowDown, ArrowUp, ClipboardCopy, FileQuestion, Lock, Plus, Sparkles, Trash2, X } from "lucide-react";
import { useQuizDetailQuery, useSaveQuizMutation } from "@/hooks/queries/useQuizzes";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { MAX_OPTIONS, parseQuizText, quizAiPrompt } from "@/lib/quizParser";
import type { QuizInput, QuizQuestionInput } from "@/types/quiz";
import { Modal } from "@/components/common/Modal";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettingsStore } from "@/stores/settingsStore";
import { EmptyBox, PageHeader, SectionHead, Skel, Tag, Toggle } from "../components/ui";

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
  coinReward: string; // "0" = coin berilmaydi
  passPercent: string;
  isActive: boolean;
}

const EMPTY_META: MetaForm = {
  title: "",
  description: "",
  groupId: "",
  timeLimit: "",
  coinReward: "10",
  passPercent: "60",
  isActive: true,
};

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
      coinReward: String(existing.coinReward ?? 0),
      passPercent: String(existing.passPercent ?? 60),
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
  const coins = Number(meta.coinReward);
  const coinError = !(meta.coinReward.trim() && Number.isInteger(coins) && coins >= 0 && coins <= 1000)
    ? t("quizzes.error.coinReward")
    : undefined;
  const pass = Number(meta.passPercent);
  const passError = !(meta.passPercent.trim() && Number.isInteger(pass) && pass >= 1 && pass <= 100)
    ? t("quizzes.error.passPercent")
    : undefined;
  const problems = questions.map(questionProblem);
  const hasErrors = Boolean(
    titleError || limitError || coinError || passError || questions.length === 0 || problems.some(Boolean),
  );

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
      coinReward: coins,
      passPercent: pass,
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
      <div aria-busy="true">
        <Skel className="mt-2 h-6 w-24 rounded-lg" />
        <Skel className="mt-3 h-8 w-1/2 rounded-xl" />
        <Skel className="mt-2 h-4 w-2/3 rounded-lg" />
        <div className="u-two mt-6">
          <div className="grid gap-3">
            <Skel className="h-64" />
            <Skel className="h-64" />
          </div>
          <Skel className="h-80 order-first min-[960px]:order-none" />
        </div>
      </div>
    );
  }

  if (id && isError) {
    return (
      <>
        <PageHeader title={t("quizzes.edit")} back={{ to: "/tests" }} />
        <EmptyBox
          icon={AlertTriangle}
          tone="er"
          title={getErrorMessage(error, t("quizzes.loadError"))}
          action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
        />
      </>
    );
  }

  return (
    // Bottom room for the floating save bar.
    <div className="pb-24 min-[960px]:pb-20">
      <PageHeader
        title={id ? t("quizzes.edit") : t("quizzes.create")}
        subtitle={t("quizzes.editorHint")}
        back={{ to: "/tests" }}
      />

      <div className="u-two">
        {/* ── Questions ── */}
        <section className="min-w-0">
          <SectionHead
            title={
              <>
                {t("quizzes.questions")} <span className="text-u-mu">({questions.length})</span>
              </>
            }
            right={
              !locked && (
                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    className="u-btn soft sm"
                    onClick={() => setImportOpen(true)}
                    disabled={questions.length >= MAX_QUESTIONS}
                  >
                    <Sparkles className="u-i s" strokeWidth={2} aria-hidden="true" />
                    {t("quizzes.import.open")}
                  </button>
                  <button
                    type="button"
                    className="u-btn sm"
                    onClick={() => setQuestions((qs) => [...qs, emptyQuestion()])}
                    disabled={questions.length >= MAX_QUESTIONS}
                  >
                    <Plus className="u-i s" strokeWidth={2} aria-hidden="true" />
                    {t("quizzes.addQuestion")}
                  </button>
                </div>
              )
            }
            className="flex-wrap"
          />

          <div className="u-stack">
            {locked && (
              <div className="u-card flex items-center gap-3 !p-3.5">
                <span className="u-mi" style={{ background: "var(--gdt)", color: "var(--gdx)" }}>
                  <Lock className="u-i" strokeWidth={2} aria-hidden="true" />
                </span>
                <p className="min-w-0 text-sm font-semibold">{t("quizzes.locked", { count: existing?.attemptCount ?? 0 })}</p>
              </div>
            )}

            {questions.length === 0 && (
              <EmptyBox icon={FileQuestion} tone={showErrors ? "er" : "mu"} title={t("quizzes.noQuestionsYet")} />
            )}

            {questions.map((q, index) => {
              const problem = showErrors ? problems[index] : null;
              return (
                <div
                  key={q.key}
                  className="u-card grid gap-3"
                  style={problem ? { boxShadow: "inset 0 0 0 2px var(--er), var(--sh)" } : undefined}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Tag tone={problem ? "er" : "pr"}>{t("quizzes.questionN", { n: index + 1 })}</Tag>
                    {!locked && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="u-ib !w-9 !h-9"
                          onClick={() => move(index, -1)}
                          disabled={index === 0}
                          aria-label={t("quizzes.moveUp")}
                        >
                          <ArrowUp className="u-i s" strokeWidth={2} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="u-ib !w-9 !h-9"
                          onClick={() => move(index, 1)}
                          disabled={index === questions.length - 1}
                          aria-label={t("quizzes.moveDown")}
                        >
                          <ArrowDown className="u-i s" strokeWidth={2} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="u-ib !w-9 !h-9"
                          onClick={() => setQuestions((qs) => qs.filter((x) => x.key !== q.key))}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="u-i s" strokeWidth={2} aria-hidden="true" />
                        </button>
                      </div>
                    )}
                  </div>

                  <Textarea
                    value={q.text}
                    placeholder={t("quizzes.field.question")}
                    aria-label={t("quizzes.field.question")}
                    maxLength={1000}
                    disabled={locked}
                    onChange={(e) => updateQuestion(q.key, { text: e.target.value })}
                    className="min-h-[64px] disabled:opacity-70"
                  />

                  <div className="grid gap-2" role="radiogroup" aria-label={t("quizzes.field.correct")}>
                    {q.options.map((option, i) => {
                      const correct = q.correctIndex === i;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <button
                            type="button"
                            role="radio"
                            aria-checked={correct}
                            aria-label={t("quizzes.markCorrect", { letter: LETTERS[i] })}
                            disabled={locked}
                            onClick={() => updateQuestion(q.key, { correctIndex: i })}
                            className={cn(
                              "w-10 h-10 rounded-full flex-none grid place-items-center font-fd text-base font-extrabold transition-colors disabled:cursor-not-allowed",
                              correct ? "bg-[rgb(var(--u-okf))] text-white" : "bg-u-sf2 text-u-mu hover:text-u-tx",
                            )}
                          >
                            {LETTERS[i]}
                          </button>
                          <Input
                            value={option}
                            maxLength={300}
                            disabled={locked}
                            aria-label={t("quizzes.field.option", { letter: LETTERS[i] })}
                            placeholder={t("quizzes.field.option", { letter: LETTERS[i] })}
                            onChange={(e) => setOption(q, i, e.target.value)}
                            containerClassName="flex-1 min-w-0"
                            className={cn("disabled:opacity-70", correct && "!border-u-ok")}
                          />
                          {!locked && q.options.length > 2 && (
                            <button
                              type="button"
                              className="u-ib !w-9 !h-9"
                              onClick={() => removeOption(q, i)}
                              aria-label={t("quizzes.removeOption")}
                            >
                              <X className="u-i s" strokeWidth={2} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {!locked && q.options.length < MAX_OPTIONS ? (
                      <button
                        type="button"
                        className="u-chip !bg-u-prt !text-u-pr"
                        onClick={() => updateQuestion(q.key, { options: [...q.options, ""] })}
                      >
                        <Plus className="u-i s" strokeWidth={2} aria-hidden="true" />
                        {t("quizzes.addOption")}
                      </button>
                    ) : (
                      <span />
                    )}
                    <span className={cn("text-[13px] font-bold", problem ? "text-u-er" : "text-u-mu")}>
                      {problem ? t(problem) : t("quizzes.correctHint")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Test settings (first on phones, a sticky side card on desktop) ── */}
        <aside className="order-first min-[960px]:order-none min-[960px]:sticky min-[960px]:top-[84px]">
          <div className="u-card grid gap-3.5">
            <h2>{t("us.manage.testInfo")}</h2>
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
              className="min-h-[72px]"
            />
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 min-[960px]:grid-cols-1 min-[1180px]:grid-cols-2 gap-3.5">
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
                inputMode="numeric"
                min={1}
                max={180}
                placeholder={t("quizzes.noLimit")}
                value={meta.timeLimit}
                onChange={(e) => setMeta({ ...meta, timeLimit: e.target.value })}
                error={limitError}
              />
              <Input
                label={t("quizzes.field.coinReward")}
                type="number"
                inputMode="numeric"
                min={0}
                max={1000}
                value={meta.coinReward}
                onChange={(e) => setMeta({ ...meta, coinReward: e.target.value })}
                error={showErrors || meta.coinReward.trim() ? coinError : undefined}
              />
              <Input
                label={t("quizzes.field.passPercent")}
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={meta.passPercent}
                onChange={(e) => setMeta({ ...meta, passPercent: e.target.value })}
                error={showErrors || meta.passPercent.trim() ? passError : undefined}
              />
            </div>
            {!coinError && !passError && (
              <p className="u-sub text-[13px] -mt-1">
                {coins > 0 ? t("quizzes.rewardHint", { pass, coins }) : t("quizzes.noReward")}
              </p>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={meta.isActive}
              onClick={() => setMeta({ ...meta, isActive: !meta.isActive })}
              className="u-row !bg-u-sf2"
            >
              <span className="g font-bold">{t("missions.field.isActive")}</span>
              <Toggle on={meta.isActive} />
            </button>
          </div>
        </aside>
      </div>

      {/* Floating save bar: above the phone tab bar (76px + 10px gap), bottom-right on desktop. */}
      <div className="fixed z-[7] left-2.5 right-2.5 mx-auto max-w-[520px] bottom-[calc(96px+env(safe-area-inset-bottom,0px))] min-[960px]:left-auto min-[960px]:right-7 min-[960px]:mx-0 min-[960px]:bottom-6 min-[960px]:w-[400px]">
        <div className="flex items-center gap-3 rounded-[22px] bg-u-sf p-2 pl-4 shadow-u-lg border border-u-ln">
          <span className="flex-1 min-w-0 truncate text-sm font-bold text-u-mu">
            {t("quizzes.questionCount", { count: questions.length })}
          </span>
          <Button onClick={handleSave} isLoading={save.isPending} className="flex-none px-7">
            {id ? t("common.update") : t("common.create")}
          </Button>
        </div>
      </div>

      <Modal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        title={t("quizzes.import.title")}
        maxWidth="sm:max-w-[640px]"
      >
        <div className="grid gap-3.5">
          <p className="u-sub !mt-0 text-sm">{t("quizzes.import.hint")}</p>
          <div>
            <div className="u-sech !mb-2 flex-wrap">
              <h3>{t("quizzes.import.format")}</h3>
              <button type="button" className="u-btn soft sm" onClick={copyPrompt}>
                <ClipboardCopy className="u-i s" strokeWidth={2} aria-hidden="true" />
                {t("quizzes.import.copyPrompt")}
              </button>
            </div>
            <div className="u-paper full font-mono !text-[13px] !leading-relaxed">
              {"1. Savol matni?\nA) Variant\nB) Variant\nC) Variant\nD) Variant\nJavob: B"}
            </div>
          </div>
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={t("quizzes.import.placeholder")}
            aria-label={t("quizzes.import.placeholder")}
            className="min-h-[180px] sm:min-h-[220px] font-mono text-sm"
          />
          {importText.trim() && (
            <div className="grid gap-1.5 text-sm">
              <p className="font-bold">
                <Tag tone={parsedValid.length ? "ok" : "er"}>
                  {t("quizzes.import.found", { count: parsed.length, valid: parsedValid.length })}
                </Tag>
              </p>
              {parsed.some((q) => q.errors.length > 0) && (
                <ul className="text-[13px] font-bold text-u-er grid gap-0.5 max-h-28 overflow-y-auto break-words">
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
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1 min-w-0" onClick={addImported} disabled={parsedValid.length === 0}>
              <span className="truncate">{t("quizzes.import.add", { count: parsedValid.length })}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
