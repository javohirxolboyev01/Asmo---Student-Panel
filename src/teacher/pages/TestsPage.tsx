// src/teacher/pages/TestsPage.tsx
// Testlar ro'yxati: yaratish, tahrirlash, natijalar, faol/nofaol, o'chirish.
// Talabaga test "Testdan o'tish" missiyasi orqali chiqadi.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  FileQuestion,
  ListChecks,
  Pencil,
  Plus,
  Trash2,
  Users,
  Wrench,
} from "lucide-react";
import { useDeleteQuizMutation, useQuizzesQuery, useSetQuizActiveMutation } from "@/hooks/queries/useQuizzes";
import type { QuizSummary } from "@/types/quiz";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { Button } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { ApiError } from "@/services/apiClient";
import { EmptyBox, PageHeader, Ring, Seg, Skel, Toggle } from "../components/ui";

type Filter = "all" | "active" | "inactive";

export const TestsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: quizzes = [], isLoading, isError, error, refetch, isFetching } = useQuizzesQuery();
  const setActive = useSetQuizActiveMutation();
  const deleteQuiz = useDeleteQuizMutation();
  const [deleting, setDeleting] = useState<QuizSummary | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const handleToggle = async (quiz: QuizSummary) => {
    setTogglingId(quiz.id);
    try {
      await setActive.mutateAsync({ id: quiz.id, isActive: !quiz.isActive });
      toast.success(t("common.updateSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteQuiz.mutateAsync(deleting.id);
      setDeleting(null);
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="mt-2 h-8 w-1/2 rounded-xl" />
        <Skel className="mt-2 h-4 w-1/3 rounded-lg" />
        <Skel className="mt-5 h-11 w-64 rounded-[14px]" />
        <div className="u-cols c3 u-stack mt-4">
          {[0, 1, 2].map((i) => (
            <Skel key={i} className="h-[250px]" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = quizzes.filter((q) => q.isActive).length;
  const shown = quizzes.filter((q) => filter === "all" || q.isActive === (filter === "active"));
  const notReady = error instanceof ApiError && error.status === 503;

  return (
    <>
      <PageHeader
        title={t("quizzes.title")}
        subtitle={quizzes.length ? t("us.manage.testsActive", { count: activeCount }) : t("quizzes.subtitle")}
        right={
          <button type="button" className="u-btn" onClick={() => navigate("/tests/new")} aria-label={t("quizzes.create")}>
            <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
            {t("us.manage.testBtn")}
          </button>
        }
      />

      {notReady ? (
        <EmptyBox icon={Wrench} tone="mu" title={t("quizzes.notReady")} text={t("quizzes.notReadyHint")} />
      ) : isError ? (
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
      ) : quizzes.length === 0 ? (
        <EmptyBox
          icon={FileQuestion}
          tone="mu"
          title={t("quizzes.empty")}
          text={t("quizzes.emptyHint")}
          action={
            <button type="button" className="u-btn" onClick={() => navigate("/tests/new")}>
              <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
              {t("quizzes.create")}
            </button>
          }
        />
      ) : (
        <>
          <div className="mb-3.5">
            <Seg<Filter>
              value={filter}
              onChange={setFilter}
              label={t("us.manage.filterLabel")}
              options={[
                { value: "all", label: t("us.manage.all") },
                { value: "active", label: t("missions.active") },
                { value: "inactive", label: t("missions.inactive") },
              ]}
            />
          </div>

          <div className="u-cols c3 u-stack">
            {shown.map((quiz) => (
              <article key={quiz.id} className="u-card grid gap-3 content-start">
                <div className="flex items-center gap-3">
                  <span
                    className={cn("u-mi !w-[54px] !h-[54px]", !quiz.isActive && "opacity-60")}
                    style={{ background: "var(--prt)", color: "var(--pr)" }}
                  >
                    <ListChecks className="u-i l" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="break-words">{quiz.title}</h3>
                    <p className="u-sub !mt-0.5 text-sm flex items-center gap-1.5 min-w-0">
                      <Users className="u-i s" strokeWidth={2} aria-hidden="true" />
                      <span className="truncate">{quiz.groupId ? quiz.groupName ?? "—" : t("missions.allStudents")}</span>
                    </p>
                  </div>
                </div>

                {quiz.description && <p className="u-sub !mt-0 text-sm break-words line-clamp-2">{quiz.description}</p>}

                <div className="u-chips">
                  <span className="u-chip">
                    <FileQuestion className="u-i s" strokeWidth={2} aria-hidden="true" />
                    {t("quizzes.questionCount", { count: quiz.questionCount })}
                  </span>
                  <span className="u-chip">
                    <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />
                    {quiz.timeLimitMin ? t("quizzes.minutes", { count: quiz.timeLimitMin }) : t("quizzes.noLimit")}
                  </span>
                </div>

                <Link to={`/tests/${quiz.id}/results`} className="u-row" aria-label={`${t("us.manage.results")}: ${quiz.title}`}>
                  <Ring percent={quiz.avgPercent} />
                  <div className="g">
                    <b>{t("us.manage.results")}</b>
                    <small>
                      {t("quizzes.finishedCount", { count: quiz.finishedCount })}
                      {quiz.avgPercent != null && <> · {t("quizzes.avg", { percent: quiz.avgPercent })}</>}
                    </small>
                  </div>
                  <ChevronRight className="u-i m text-u-mu" strokeWidth={2} aria-hidden="true" />
                </Link>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="u-btn soft sm"
                      onClick={() => navigate(`/tests/${quiz.id}/edit`)}
                      aria-label={`${t("quizzes.edit")}: ${quiz.title}`}
                    >
                      <Pencil className="u-i s" strokeWidth={2} aria-hidden="true" />
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      className="u-ib"
                      onClick={() => setDeleting(quiz)}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="u-i m" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={quiz.isActive}
                    onClick={() => handleToggle(quiz)}
                    disabled={togglingId !== null}
                    className={cn(
                      "flex items-center gap-2 font-bold text-u-mu disabled:cursor-wait",
                      togglingId === quiz.id && "opacity-60",
                    )}
                  >
                    {quiz.isActive ? t("missions.active") : t("missions.inactive")}
                    <Toggle on={quiz.isActive} />
                  </button>
                </div>
              </article>
            ))}
            {shown.length === 0 && (
              <EmptyBox
                className="col-span-full"
                tone="mu"
                icon={ListChecks}
                title={t("us.manage.emptyFilter")}
                text={t("us.manage.emptyFilterHint")}
              />
            )}
          </div>
        </>
      )}

      <ConfirmModal
        isOpen={!!deleting}
        title={t("quizzes.deleteTitle")}
        message={t("quizzes.deleteConfirm", { title: deleting?.title ?? "" })}
        isLoading={deleteQuiz.isPending}
        onConfirm={handleDelete}
        onCancel={() => !deleteQuiz.isPending && setDeleting(null)}
      />
    </>
  );
};
