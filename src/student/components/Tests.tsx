// src/student/components/Tests.tsx
// Dashboard "Testlar": the student's tests (GET /quizzes/mine). Open ones
// (new / in progress) are listed; finished ones fold behind a toggle and show
// the score + coins earned. Tapping a row opens /quiz/:id.
import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, FlaskConical, ListChecks } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { MyQuiz } from "@/types/quiz";
import { EmptyState, Skel } from "./ui";
import { CoinGlyph, IconTile } from "./icons";

export const TestsSkeleton = () => (
  <>
    <Skel className="h-[70px] mb-2.5" />
    <Skel className="h-[70px] mb-2.5" />
  </>
);

const TestRow = ({ quiz }: { quiz: MyQuiz }) => {
  const { t } = useTranslation();
  const facts = [
    t("quizPlay.questions", { count: quiz.questionCount }),
    quiz.timeLimitMin ? t("quizPlay.minutes", { count: quiz.timeLimitMin }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const badge =
    quiz.status === "finished" ? (
      <span className="sp-test-badge sp-done">{t("home.testDone", { n: quiz.percent ?? 0 })}</span>
    ) : quiz.status === "running" ? (
      <span className="sp-test-badge sp-run">{t("home.testRunning")}</span>
    ) : (
      <span className="sp-test-badge sp-new">{t("home.testNew")}</span>
    );

  return (
    <Link to={`/quiz/${quiz.id}`} className="sp-row sp-test">
      <span className="sp-ic" aria-hidden="true">
        <IconTile icon={quiz.status === "finished" ? ListChecks : FlaskConical} tint="purple" />
      </span>
      <span className="sp-t">
        <b>{quiz.title}</b>
        <small className="truncate">{facts}</small>
        {quiz.status === "finished"
          ? quiz.coins > 0 && (
              <small className="sp-test-coins">
                <CoinGlyph /> {t("home.testEarned", { n: quiz.coins })}
              </small>
            )
          : quiz.coinReward > 0 && (
              <small className="sp-test-coins">
                <CoinGlyph /> {t("home.testReward", { coins: quiz.coinReward, pass: quiz.passPercent })}
              </small>
            )}
      </span>
      {badge}
      <ChevronRight className="sp-chev" aria-hidden="true" />
    </Link>
  );
};

export const Tests = ({ quizzes }: { quizzes: MyQuiz[] }) => {
  const { t } = useTranslation();
  const [showDone, setShowDone] = useState(false);
  const open = quizzes.filter((q) => q.status !== "finished");
  const done = quizzes.filter((q) => q.status === "finished");

  if (quizzes.length === 0)
    return <EmptyState icon={FlaskConical} title={t("home.testsEmpty")} text={t("home.testsEmptyHint")} />;

  return (
    <>
      {open.map((q) => (
        <TestRow key={q.id} quiz={q} />
      ))}
      {done.length > 0 && (
        <>
          <button
            type="button"
            className="sp-test-more"
            aria-expanded={showDone}
            onClick={() => setShowDone((v) => !v)}
          >
            {t("home.testsShowDone", { n: done.length })}
            <ChevronDown className={showDone ? "sp-rot" : undefined} aria-hidden="true" />
          </button>
          {showDone && done.map((q) => <TestRow key={q.id} quiz={q} />)}
        </>
      )}
    </>
  );
};
