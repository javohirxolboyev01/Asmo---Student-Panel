// src/teacher/pages/TestResultsPage.tsx
// Test natijalari: kim yechdi va qaysi savolda ko'p xato qilindi.
import { useParams } from "react-router-dom";
import { AlertTriangle, ListChecks, Users } from "lucide-react";
import { useQuizResultsQuery } from "@/hooks/queries/useQuizzes";
import { Button } from "@/components/ui";
import { getErrorMessage } from "@/lib/toast";
import { formatDateTime } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, BackButton, Bar, EmptyBox, PageHeader, SectionHead, Skel, Tag, type Tone } from "../components/ui";

const scoreTone = (percent: number): Tone => (percent >= 80 ? "ok" : percent >= 50 ? "gd" : "er");
const toneColor: Record<Tone, string> = {
  ok: "var(--ok)",
  gd: "var(--gd)",
  er: "var(--er)",
  pr: "var(--pr)",
  mu: "var(--mu)",
};

export const TestResultsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuizResultsQuery(id);

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="mt-2 h-6 w-24 rounded-lg" />
        <Skel className="mt-3 h-[136px] rounded-[28px]" />
        <div className="u-stats3 mt-4">
          {[0, 1, 2].map((i) => (
            <Skel key={i} className="h-[76px] rounded-[18px]" />
          ))}
        </div>
        <div className="u-two e u-sec">
          <Skel className="h-72" />
          <Skel className="h-72" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <>
        <PageHeader title={t("quizzes.title")} back={{ to: "/tests" }} />
        <EmptyBox
          icon={AlertTriangle}
          tone="er"
          title={getErrorMessage(error, t("quizzes.loadError"))}
          action={
            <Button onClick={() => refetch()} isLoading={isFetching}>
              {t("common.retry")}
            </Button>
          }
        />
      </>
    );
  }

  const finished = data.attempts.filter((a) => a.finishedAt);
  const scored = finished.filter((a) => a.percent != null);
  const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.percent ?? 0), 0) / scored.length) : null;
  // Hardest first: that's where the teacher should spend the next lesson.
  const questions = [...data.questions]
    .map((q, i) => ({ ...q, n: i + 1, rate: q.answered ? Math.round((q.correct * 100) / q.answered) : null }))
    .sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101));

  return (
    <>
      <BackButton to="/tests" />
      <section className="u-hero">
        <ListChecks className="u-gl !w-14 !h-14 opacity-90" strokeWidth={2} aria-hidden="true" />
        <h1 className="break-words">{data.title}</h1>
        <p>{t("quizzes.resultsSubtitle", { finished: finished.length, questions: data.questionCount })}</p>
      </section>

      <div className="u-stats3 mt-4">
        <div>
          <b>{finished.length}</b>
          <span>{t("us.manage.statFinished")}</span>
        </div>
        <div>
          <b style={avg != null ? { color: toneColor[scoreTone(avg)] } : undefined}>{avg != null ? `${avg}%` : "—"}</b>
          <span>{t("us.manage.statAvg")}</span>
        </div>
        <div>
          <b>{data.questionCount}</b>
          <span>{t("us.manage.statQuestions")}</span>
        </div>
      </div>

      <div className="u-two e u-sec">
        <section className="u-card">
          <SectionHead
            title={t("quizzes.students")}
            right={data.attempts.length > 0 && <Tag tone="mu">{data.attempts.length}</Tag>}
          />
          {data.attempts.length === 0 ? (
            <EmptyBox card={false} icon={Users} tone="mu" title={t("quizzes.noAttempts")} />
          ) : (
            <div className="u-stack">
              {data.attempts.map((a) => (
                <div key={a.studentId} className="u-row">
                  <Avatar name={a.studentName} seed={a.studentId} size="s" />
                  <div className="g">
                    <b className="truncate">{a.studentName}</b>
                    <small>{a.finishedAt ? formatDateTime(a.finishedAt) : t("quizzes.inProgress")}</small>
                  </div>
                  {a.percent != null ? (
                    <div className="flex-none text-right leading-tight">
                      <b className="font-fd text-[19px]" style={{ color: toneColor[scoreTone(a.percent)] }}>
                        {a.percent}%
                      </b>
                      <small>
                        {a.score}/{a.total}
                      </small>
                    </div>
                  ) : (
                    <Tag tone="gd">{t("quizzes.inProgress")}</Tag>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {finished.length > 0 && (
          <section className="u-card">
            <SectionHead title={t("quizzes.byQuestion")} />
            <p className="u-sub !-mt-1.5 mb-4 text-sm">{t("quizzes.byQuestionHint")}</p>
            <ul className="grid gap-4">
              {questions.map((q) => {
                const tone = q.rate != null ? scoreTone(q.rate) : "mu";
                return (
                  <li key={q.id}>
                    <div className="flex items-start justify-between gap-3 text-[15px]">
                      <span className="min-w-0 break-words line-clamp-2">
                        <span className="font-bold text-u-mu">{q.n}.</span> {q.text}
                      </span>
                      <b className="font-fd flex-none" style={{ color: toneColor[tone] }}>
                        {q.rate != null ? `${q.correct}/${q.answered}` : "—"}
                      </b>
                    </div>
                    <div className="mt-1.5">
                      <Bar value={q.rate ?? 0} color={toneColor[tone]} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </>
  );
};
