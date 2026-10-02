// src/student/pages/QuizPage.tsx
// Test: kirish → savollar (bittadan, taymer bilan) → natija. Ballni server
// hisoblaydi; to'g'ri javoblar brauzerga umuman kelmaydi. Javoblar
// localStorage'da saqlanadi, sahifa yangilansa ham yo'qolmaydi.
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuizPlayQuery, useStartQuizMutation, useSubmitQuizMutation } from "@/hooks/queries/useQuizzes";
import { useTranslation } from "@/hooks/useTranslation";
import { ApiError } from "@/services/apiClient";
import { quizService } from "@/services/quizService";
import { getErrorMessage } from "@/lib/toast";
import type { QuizPlay } from "@/types/quiz";
import { EmptyState, ErrorState, Modal, PageHeader, Skel, Spinner, burst } from "../components/ui";
import "../theme/quiz.css";

const LETTERS = "ABCDEF";

const storageKey = (quizId: string, startedAt: string) => `quiz:${quizId}:${startedAt}`;
const readAnswers = (key: string): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}") ?? {};
  } catch {
    return {};
  }
};
const writeAnswers = (key: string, answers: Record<string, number>) => {
  try {
    localStorage.setItem(key, JSON.stringify(answers));
  } catch {
    // Private mode / full storage: answers just won't survive a reload.
  }
};
const clearAnswers = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const QuizSkeleton = () => (
  <div aria-busy="true">
    <Skel className="mt-5 h-9 w-2/3" />
    <Skel className="mt-2 h-4 w-1/2" />
    <Skel className="mt-5 h-48" />
  </div>
);

// ── Intro ──

const Intro = ({ play, onStart, starting }: { play: QuizPlay; onStart: () => void; starting: boolean }) => {
  const { t } = useTranslation();
  return (
    <div className="sp-panel sp-quiz-intro">
      <div className="sp-quiz-big" aria-hidden="true">
        🧪
      </div>
      {play.description && <p className="sp-quiz-desc">{play.description}</p>}
      <div className="sp-quiz-facts">
        <span>📝 {t("quizPlay.questions", { count: play.questionCount })}</span>
        <span>⏱ {play.timeLimitMin ? t("quizPlay.minutes", { count: play.timeLimitMin }) : t("quizPlay.noLimit")}</span>
      </div>
      <p className="sp-quiz-rule">{t("quizPlay.onceRule")}</p>
      <button className="sp-cta sp-quiz-go" onClick={onStart} disabled={starting || play.questionCount === 0}>
        {starting ? <Spinner /> : t("quizPlay.start")}
      </button>
    </div>
  );
};

// ── Result ──

const Result = ({ play }: { play: QuizPlay }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const attempt = play.attempt!;
  const percent = attempt.percent ?? 0;
  const emoji = percent >= 80 ? "🏆" : percent >= 50 ? "🚀" : "🛰";
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (percent >= 80) burst(ref.current, "⭐", 8);
  }, [percent]);

  return (
    <div className="sp-panel sp-quiz-result" ref={ref}>
      <div className="sp-quiz-big" aria-hidden="true">
        {emoji}
      </div>
      <div className="sp-quiz-percent">{percent}%</div>
      <p>{t("quizPlay.score", { score: attempt.score ?? 0, total: attempt.total })}</p>
      <p className="sp-quiz-desc">
        {percent >= 80 ? t("quizPlay.great") : percent >= 50 ? t("quizPlay.good") : t("quizPlay.tryHarder")}
      </p>
      <p className="sp-quiz-rule">{t("quizPlay.missionHint")}</p>
      <button className="sp-cta" onClick={() => navigate("/")}>
        {t("quizPlay.toMissions")}
      </button>
    </div>
  );
};

// ── Running test ──

/** Own component so the 1s tick re-renders only the clock, not the whole test. */
const QuizClock = ({ deadline }: { deadline: number }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const left = deadline - now;
  return (
    <span className={left < 60_000 ? "sp-quiz-clock sp-quiz-low" : "sp-quiz-clock"} role="timer">
      ⏱ {formatClock(left)}
    </span>
  );
};

const AUTOSAVE_MS = 700;

const Runner = ({ play }: { play: QuizPlay }) => {
  const { t } = useTranslation();
  const attempt = play.attempt!;
  const questions = attempt.questions ?? [];
  const key = storageKey(play.id, attempt.startedAt);
  const submit = useSubmitQuizMutation(play.id);
  const [answers, setAnswers] = useState<Record<string, number>>(() => readAnswers(key));
  const [index, setIndex] = useState(() => {
    // Resume at the first unanswered question.
    const saved = readAnswers(key);
    const first = questions.findIndex((q) => saved[q.id] === undefined);
    return first < 0 ? Math.max(0, questions.length - 1) : first;
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deadline = attempt.deadline ? new Date(attempt.deadline).getTime() : null;
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const saveTimer = useRef<number>();

  const finish = useCallback(() => {
    if (submit.isPending || submit.isSuccess) return;
    setConfirmOpen(false);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    submit.mutate(answersRef.current, {
      onSuccess: () => clearAnswers(key),
      onError: (e) => setError(getErrorMessage(e, t("common.error"))),
    });
  }, [submit, key, t]);

  const finishRef = useRef(finish);
  finishRef.current = finish;

  // Autosave to the server (debounced): if the phone sleeps past the deadline,
  // the server scores these instead of closing the attempt with nothing.
  const flushSave = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = undefined;
    quizService.saveAnswers(play.id, answersRef.current).catch(() => undefined);
  }, [play.id]);
  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  // Time's up → hand in whatever is answered. Background tabs throttle timers,
  // so also check when the page becomes visible again, and save on hide.
  useEffect(() => {
    if (!deadline) return;
    const timeUp = () => Date.now() >= deadline && finishRef.current();
    const timer = window.setTimeout(timeUp, Math.max(0, deadline - Date.now()));
    const onVisibility = () => {
      if (document.visibilityState === "visible") timeUp();
      else if (saveTimer.current !== undefined) flushSave();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [deadline, flushSave]);

  const choose = (questionId: string, option: number) => {
    const next = { ...answers, [questionId]: option };
    setAnswers(next);
    answersRef.current = next;
    writeAnswers(key, next);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flushSave, AUTOSAVE_MS);
  };

  const question = questions[index];
  const answeredCount = questions.filter((q) => answers[q.id] !== undefined).length;
  const isLast = index === questions.length - 1;
  const busy = submit.isPending;

  if (!question) return <EmptyState emoji="🔭" title={t("quizPlay.notFound")} text={t("quizPlay.notFoundHint")} />;

  return (
    <>
      <div className="sp-quiz-bar">
        <span>{t("quizPlay.progress", { n: index + 1, total: questions.length })}</span>
        {deadline !== null && <QuizClock deadline={deadline} />}
      </div>
      <div className="sp-quiz-track" aria-hidden="true">
        <div style={{ width: `${(answeredCount * 100) / questions.length}%` }} />
      </div>

      <div className="sp-panel sp-quiz-q">
        <h2>{question.text}</h2>
        <div className="sp-quiz-opts" role="radiogroup" aria-label={question.text}>
          {question.options.map((option, i) => {
            const on = answers[question.id] === option.index;
            return (
              <button
                key={option.index}
                role="radio"
                aria-checked={on}
                className={on ? "sp-quiz-opt on" : "sp-quiz-opt"}
                onClick={() => choose(question.id, option.index)}
                disabled={busy}
              >
                <span className="sp-quiz-letter">{LETTERS[i]}</span>
                <span>{option.text}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sp-quiz-dots" aria-label={t("quizPlay.jump")}>
        {questions.map((q, i) => (
          <button
            key={q.id}
            className={[i === index && "cur", answers[q.id] !== undefined && "done"].filter(Boolean).join(" ")}
            onClick={() => setIndex(i)}
            aria-label={t("quizPlay.progress", { n: i + 1, total: questions.length })}
            aria-current={i === index ? "step" : undefined}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="sp-quiz-nav">
        <button className="sp-cta sp-ghost" onClick={() => setIndex(index - 1)} disabled={index === 0 || busy}>
          ‹ {t("quizPlay.prev")}
        </button>
        {isLast ? (
          <button
            className="sp-cta"
            disabled={busy}
            onClick={() => (answeredCount < questions.length ? setConfirmOpen(true) : finish())}
          >
            {busy ? <Spinner /> : t("quizPlay.finish")}
          </button>
        ) : (
          <button className="sp-cta" onClick={() => setIndex(index + 1)} disabled={busy}>
            {t("quizPlay.next")} ›
          </button>
        )}
      </div>

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} labelledBy="sp-quiz-confirm">
        <div className="text-5xl" aria-hidden="true">
          🤔
        </div>
        <h2 id="sp-quiz-confirm">{t("quizPlay.confirmTitle")}</h2>
        <p>{t("quizPlay.confirmText", { count: questions.length - answeredCount })}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="sp-cta sp-ghost" onClick={() => setConfirmOpen(false)}>
            {t("quizPlay.keepGoing")}
          </button>
          <button className="sp-cta" onClick={finish}>
            {t("quizPlay.finish")}
          </button>
        </div>
      </Modal>

      <Modal open={Boolean(error)} onClose={() => setError(null)}>
        <div className="text-5xl" aria-hidden="true">
          🛰
        </div>
        <h2>{t("common.error")}</h2>
        <p>{error}</p>
        <button
          className="sp-cta"
          onClick={() => {
            setError(null);
            finish();
          }}
        >
          {t("common.retry")}
        </button>
      </Modal>
    </>
  );
};

export const QuizPage = () => {
  const { t } = useTranslation();
  const { id = "" } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useQuizPlayQuery(id);
  const start = useStartQuizMutation(id);
  const [startError, setStartError] = useState<string | null>(null);

  const header = <PageHeader title={data?.title ?? t("quizPlay.title")} back={{ to: "/" }} />;

  if (isLoading) return <QuizSkeleton />;

  // Cached data wins over a failed background refetch (offline, flaky network).
  if (!data) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <>
        {header}
        {notFound ? (
          <EmptyState emoji="🔭" title={t("quizPlay.notFound")} text={t("quizPlay.notFoundHint")} className="mt-4" />
        ) : (
          <ErrorState onRetry={() => refetch()} />
        )}
      </>
    );
  }

  const attempt = data.attempt;
  return (
    <>
      {header}
      <div className="mt-4">
        {!attempt ? (
          <Intro
            play={data}
            starting={start.isPending}
            onStart={() =>
              start.mutate(undefined, { onError: (e) => setStartError(getErrorMessage(e, t("common.error"))) })
            }
          />
        ) : attempt.finishedAt ? (
          <Result play={data} />
        ) : (
          <Runner key={attempt.startedAt} play={data} />
        )}
      </div>
      {startError && <p className="sp-msg sp-err text-center">{startError}</p>}
    </>
  );
};
