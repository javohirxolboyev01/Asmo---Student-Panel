// src/teacher/components/QuizAiSheet.tsx — "AI bilan test tuzish".
//
// The app has no AI of its own; the teacher's own ChatGPT / Gemini / Claude
// writes the questions. The flow is three explicit steps:
//   1. Set up: topic, how many questions, options per question, difficulty,
//      language, and optionally a sample / lesson text to base them on.
//   2. Send: "Open in ChatGPT" opens it with the request already typed in
//      (chatgpt.com/?q=…); "Copy" is for any other AI.
//   3. Paste the AI's reply: lib/quizParser checks every question, shows
//      asked / found / ready, and only valid ones are added to the test.
import { useEffect, useMemo, useState } from "react";
import { ClipboardCopy, ExternalLink, Sparkles } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button, Input, Textarea } from "@/components/ui";
import {
  MAX_MATERIAL,
  MAX_OPTIONS,
  buildQuizAiPrompt,
  parseQuizText,
  type QuizDifficulty,
  type QuizLang,
} from "@/lib/quizParser";
import type { QuizQuestionInput } from "@/types/quiz";
import { toast } from "@/lib/toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useSettingsStore } from "@/stores/settingsStore";
import { Seg, Tag } from "./ui";

const COUNT_PRESETS = [5, 10, 15, 20, 30];
/** ChatGPT's ?q= link stops working well past this many URL characters. */
const MAX_LINK = 7000;

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <section className="grid gap-3 rounded-[18px] bg-u-sf2 p-4">
    <h3 className="flex items-center gap-2 text-base font-extrabold">
      <span className="inline-grid h-6 w-6 flex-none place-items-center rounded-full bg-u-pr text-[13px] font-extrabold text-u-on">
        {n}
      </span>
      {title}
    </h3>
    {children}
  </section>
);

export const QuizAiSheet = ({
  open,
  onClose,
  room,
  defaultTopic,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  /** How many more questions the test can take. */
  room: number;
  /** Prefills the topic (the test's title) when the topic is still empty. */
  defaultTopic: string;
  onAdd: (questions: QuizQuestionInput[]) => void;
}) => {
  const { t } = useTranslation();
  const uiLang = useSettingsStore((s) => s.language) as QuizLang;

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState("");
  const [optionCount, setOptionCount] = useState(4);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [lang, setLang] = useState<QuizLang>(uiLang);
  const [material, setMaterial] = useState("");
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (open && !topic.trim() && defaultTopic.trim()) setTopic(defaultTopic.trim());
    // Only when the sheet opens: later title edits don't overwrite the topic.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // The asked-for count never exceeds what the test can still take.
  const maxCount = Math.max(1, room);
  const custom = Number(customCount);
  const asked = Math.min(customCount.trim() && Number.isInteger(custom) && custom >= 1 ? custom : count, maxCount);

  const ready = Boolean(topic.trim() || material.trim());
  const prompt = useMemo(
    () => buildQuizAiPrompt({ topic, count: asked, optionCount, difficulty, lang, material }),
    [topic, asked, optionCount, difficulty, lang, material],
  );
  const chatGptUrl = `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`;
  const linkTooLong = chatGptUrl.length > MAX_LINK;

  const parsed = useMemo(() => parseQuizText(reply), [reply]);
  const valid = parsed.filter((q) => q.errors.length === 0);
  const adding = Math.min(valid.length, room);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success(t("quizzes.ai.copied"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  const openChatGpt = () => {
    window.open(chatGptUrl, "_blank", "noopener,noreferrer");
    toast.info(t("quizzes.ai.opened"));
  };

  const add = () => {
    onAdd(valid.slice(0, room).map(({ text, options, correctIndex }) => ({ text, options, correctIndex })));
    setReply("");
  };

  const disabledHint = !ready ? t("quizzes.ai.needTopic") : undefined;

  return (
    <Modal isOpen={open} onClose={onClose} title={t("quizzes.ai.title")} maxWidth="sm:max-w-[680px]">
      <div className="grid gap-3.5">
        <p className="u-sub !mt-0 text-sm">{t("quizzes.ai.how")}</p>

        {/* ── 1. Set up ── */}
        <Step n={1} title={t("quizzes.ai.step1")}>
          <Input
            label={t("quizzes.ai.topic")}
            placeholder={t("quizzes.ai.topicPh")}
            value={topic}
            maxLength={200}
            onChange={(e) => setTopic(e.target.value)}
          />

          <div className="grid gap-2">
            <span className="text-sm font-bold">{t("quizzes.ai.count")}</span>
            <div className="flex flex-wrap items-center gap-2">
              <Seg
                small
                label={t("quizzes.ai.count")}
                value={customCount.trim() ? null : String(count)}
                options={COUNT_PRESETS.filter((n) => n <= maxCount).map((n) => ({ value: String(n), label: n }))}
                onChange={(v) => {
                  setCount(Number(v));
                  setCustomCount("");
                }}
              />
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={maxCount}
                value={customCount}
                placeholder={t("quizzes.ai.countCustom")}
                aria-label={t("quizzes.ai.countCustom")}
                onChange={(e) => setCustomCount(e.target.value)}
                containerClassName="w-[150px]"
              />
            </div>
            <small className="text-[13px] font-semibold text-u-mu">{t("quizzes.ai.room", { n: room })}</small>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <span className="text-sm font-bold">{t("quizzes.ai.options")}</span>
              <Seg
                small
                label={t("quizzes.ai.options")}
                value={String(optionCount)}
                options={[3, 4, 5].filter((n) => n <= MAX_OPTIONS).map((n) => ({ value: String(n), label: n }))}
                onChange={(v) => setOptionCount(Number(v))}
              />
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-bold">{t("quizzes.ai.lang")}</span>
              <Seg
                small
                label={t("quizzes.ai.lang")}
                value={lang}
                options={[
                  { value: "uz", label: "O'zbek" },
                  { value: "ru", label: "Русский" },
                  { value: "en", label: "English" },
                ]}
                onChange={setLang}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-bold">{t("quizzes.ai.difficulty")}</span>
            <Seg
              small
              label={t("quizzes.ai.difficulty")}
              value={difficulty}
              options={(["easy", "medium", "hard", "mixed"] as const).map((d) => ({ value: d, label: t(`quizzes.ai.${d}`) }))}
              onChange={setDifficulty}
            />
          </div>

          <div className="grid gap-1.5">
            <Textarea
              label={t("quizzes.ai.material")}
              placeholder={t("quizzes.ai.materialHint")}
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="min-h-[90px] text-sm"
            />
            {material.length > MAX_MATERIAL && (
              <small className="text-[13px] font-bold text-u-er">{t("quizzes.ai.materialLong", { n: MAX_MATERIAL })}</small>
            )}
          </div>
        </Step>

        {/* ── 2. Send ── */}
        <Step n={2} title={t("quizzes.ai.step2")}>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={openChatGpt}
              disabled={!ready || linkTooLong}
              title={disabledHint}
              leftIcon={<ExternalLink className="u-i s" strokeWidth={2} aria-hidden="true" />}
            >
              {t("quizzes.ai.openChatGpt")}
            </Button>
            <Button
              variant="outline"
              onClick={copy}
              disabled={!ready}
              title={disabledHint}
              leftIcon={<ClipboardCopy className="u-i s" strokeWidth={2} aria-hidden="true" />}
            >
              {t("quizzes.ai.copy")}
            </Button>
          </div>
          {!ready && <small className="text-[13px] font-bold text-u-er">{t("quizzes.ai.needTopic")}</small>}
          {ready && linkTooLong && (
            <small className="text-[13px] font-bold text-u-mu">{t("quizzes.ai.tooLongForLink")}</small>
          )}
          <details>
            <summary className="cursor-pointer text-sm font-bold text-u-pr">{t("quizzes.ai.preview")}</summary>
            <div className="u-paper full mt-2 max-h-[260px] overflow-y-auto whitespace-pre-wrap break-words font-mono !text-[12.5px] !leading-relaxed">
              {prompt}
            </div>
          </details>
        </Step>

        {/* ── 3. Paste the reply ── */}
        <Step n={3} title={t("quizzes.ai.step3")}>
          <Textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder={t("quizzes.ai.pastePh")}
            aria-label={t("quizzes.ai.step3")}
            className="min-h-[160px] sm:min-h-[200px] font-mono text-sm"
          />
          {!reply.trim() ? (
            <details>
              <summary className="cursor-pointer text-sm font-bold text-u-mu">{t("quizzes.ai.pasteHint")}</summary>
              <div className="u-paper full mt-2 whitespace-pre-wrap font-mono !text-[13px] !leading-relaxed">
                {"1. Savol matni?\nA) Variant\nB) Variant\nC) Variant\nD) Variant\nJavob: B"}
              </div>
            </details>
          ) : (
            <div className="grid gap-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Tag tone="mu">
                  {t("quizzes.ai.asked")}: {asked}
                </Tag>
                <Tag tone="pr">
                  {t("quizzes.ai.found")}: {parsed.length}
                </Tag>
                <Tag tone={valid.length ? "ok" : "er"}>
                  {t("quizzes.ai.ready")}: {valid.length}
                </Tag>
              </div>
              {valid.length > 0 && valid.length < asked && (
                <p className="text-[13px] font-bold text-u-mu">{t("quizzes.ai.fewer", { asked, got: valid.length })}</p>
              )}
              {parsed.length > asked && (
                <p className="text-[13px] font-bold text-u-mu">{t("quizzes.ai.more", { asked, got: parsed.length })}</p>
              )}
              {valid.length > room && <p className="text-[13px] font-bold text-u-er">{t("quizzes.ai.overRoom", { n: room })}</p>}
              {parsed.some((q) => q.errors.length > 0) && (
                <ul className="grid max-h-28 gap-0.5 overflow-y-auto break-words text-[13px] font-bold text-u-er">
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
        </Step>

        <div className="flex gap-2.5">
          <Button variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            className="min-w-0 flex-1"
            onClick={add}
            disabled={adding === 0}
            leftIcon={<Sparkles className="u-i s" strokeWidth={2} aria-hidden="true" />}
          >
            <span className="truncate">{t("quizzes.ai.add", { count: adding })}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
