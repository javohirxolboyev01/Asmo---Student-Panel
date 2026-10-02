// src/teacher/pages/TestResultsPage.tsx
// Test natijalari: kim yechdi va qaysi savolda ko'p xato qilindi.
import { useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useQuizResultsQuery } from "@/hooks/queries/useQuizzes";
import { useGoBack } from "@/hooks/useNavigationHistory";
import { SkeletonHeader, SkeletonTable } from "@/components/common/Skeleton";
import { Button } from "@/components/ui";
import { getErrorMessage } from "@/lib/toast";
import { formatDateTime } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

const scoreTone = (percent: number) =>
  percent >= 80 ? "text-[#2E7D32] dark:text-[#66BB6A]" : percent >= 50 ? "text-warning" : "text-red-500";

export const TestResultsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const goBack = useGoBack("/tests");
  const { data, isLoading, isError, error, refetch, isFetching } = useQuizResultsQuery(id);

  const back = (
    <button type="button" onClick={goBack} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-warning">
      <ChevronLeft className="w-4 h-4" />
      {t("common.back")}
    </button>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonHeader />
        <SkeletonTable rows={5} cols={3} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-4">
        {back}
        <div className="card p-5 text-center space-y-3">
          <p className="text-red-500">{getErrorMessage(error, t("quizzes.loadError"))}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isFetching}>
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const finished = data.attempts.filter((a) => a.finishedAt);
  // Hardest first: that's where the teacher should spend the next lesson.
  const questions = [...data.questions]
    .map((q, i) => ({ ...q, n: i + 1, rate: q.answered ? Math.round((q.correct * 100) / q.answered) : null }))
    .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101));

  return (
    <div className="space-y-4 md:space-y-5">
      {back}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 break-words">{data.title}</h1>
        <p className="text-gray-500 text-sm md:text-base">
          {t("quizzes.resultsSubtitle", { finished: finished.length, questions: data.questionCount })}
        </p>
      </div>

      <div className="card p-4 md:p-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("quizzes.students")}</h2>
        {data.attempts.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">{t("quizzes.noAttempts")}</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.attempts.map((a) => (
              <li key={a.studentId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{a.studentName}</p>
                  <p className="text-xs text-gray-400">
                    {a.finishedAt ? formatDateTime(a.finishedAt) : t("quizzes.inProgress")}
                  </p>
                </div>
                {a.percent != null && (
                  <div className="text-right flex-shrink-0">
                    <p className={cn("text-sm font-bold", scoreTone(a.percent))}>{a.percent}%</p>
                    <p className="text-xs text-gray-400">
                      {a.score}/{a.total}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {finished.length > 0 && (
        <div className="card p-4 md:p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("quizzes.byQuestion")}</h2>
          <p className="text-xs text-gray-400 mb-3">{t("quizzes.byQuestionHint")}</p>
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.id}>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-gray-700 dark:text-gray-200 min-w-0 break-words line-clamp-2">
                    <span className="text-gray-400">{q.n}.</span> {q.text}
                  </span>
                  <span className={cn("font-semibold flex-shrink-0", q.rate != null && scoreTone(q.rate))}>
                    {q.rate != null ? `${q.correct}/${q.answered}` : "—"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      (q.rate ?? 0) >= 80 ? "bg-[#2E7D32]" : (q.rate ?? 0) >= 50 ? "bg-warning" : "bg-red-500",
                    )}
                    style={{ width: `${q.rate ?? 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
