// src/teacher/pages/TestsPage.tsx
// Testlar ro'yxati: yaratish, tahrirlash, natijalar, faol/nofaol, o'chirish.
// Talabaga test "Testdan o'tish" missiyasi orqali chiqadi.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Clock, FileQuestion, ListChecks, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useDeleteQuizMutation, useQuizzesQuery, useSetQuizActiveMutation } from "@/hooks/queries/useQuizzes";
import type { QuizSummary } from "@/types/quiz";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonHeader, SkeletonCardGrid } from "@/components/common/Skeleton";
import { Button, IconButton } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { ApiError } from "@/services/apiClient";

export const TestsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: quizzes = [], isLoading, isError, error, refetch, isFetching } = useQuizzesQuery();
  const setActive = useSetQuizActiveMutation();
  const deleteQuiz = useDeleteQuizMutation();
  const [deleting, setDeleting] = useState<QuizSummary | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <SkeletonCardGrid count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t("quizzes.title")}</h1>
          <p className="text-gray-500 text-sm md:text-base">{t("quizzes.subtitle")}</p>
        </div>
        <Button
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate("/tests/new")}
          className="flex-shrink-0"
          aria-label={t("quizzes.create")}
        >
          <span className="hidden sm:inline">{t("quizzes.create")}</span>
        </Button>
      </div>

      {error instanceof ApiError && error.status === 503 ? (
        <div className="card p-5 text-center space-y-2">
          <p className="font-semibold text-gray-800 dark:text-gray-100">{t("quizzes.notReady")}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("quizzes.notReadyHint")}</p>
        </div>
      ) : isError ? (
        <div className="card p-5 text-center space-y-3">
          <p className="text-red-500">{getErrorMessage(error, t("quizzes.loadError"))}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isFetching}>
            {t("common.retry")}
          </Button>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="card p-5">
          <EmptyState icon={FileQuestion} title={t("quizzes.empty")} description={t("quizzes.emptyHint")} />
          <div className="flex justify-center -mt-4 pb-4">
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => navigate("/tests/new")}>
              {t("quizzes.create")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={cn("card p-4 md:p-5 flex flex-col gap-3 transition-opacity", !quiz.isActive && "opacity-60")}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-warning/10 dark:bg-warning/15 flex items-center justify-center flex-shrink-0">
                  <ListChecks className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 break-words">{quiz.title}</h3>
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        quiz.isActive
                          ? "bg-[#E8F5E9] text-[#2E7D32] dark:bg-[#2E7D32]/20 dark:text-[#66BB6A]"
                          : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
                      )}
                    >
                      {quiz.isActive ? t("missions.active") : t("missions.inactive")}
                    </span>
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words line-clamp-2">
                      {quiz.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <IconButton size="sm" onClick={() => navigate(`/tests/${quiz.id}/edit`)} aria-label={t("quizzes.edit")}>
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton size="sm" variant="danger" onClick={() => setDeleting(quiz)} aria-label={t("common.delete")}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                  {t("quizzes.questionCount", { count: quiz.questionCount })}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                  <Clock className="w-3.5 h-3.5" />
                  {quiz.timeLimitMin ? t("quizzes.minutes", { count: quiz.timeLimitMin }) : t("quizzes.noLimit")}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                  <Users className="w-3.5 h-3.5" />
                  {quiz.groupId ? quiz.groupName ?? "—" : t("missions.allStudents")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Link
                  to={`/tests/${quiz.id}/results`}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-warning"
                >
                  <BarChart3 className="w-4 h-4 text-warning" />
                  {t("quizzes.finishedCount", { count: quiz.finishedCount })}
                  {quiz.avgPercent != null && <> · {t("quizzes.avg", { percent: quiz.avgPercent })}</>}
                </Link>
                <Button
                  size="sm"
                  variant={quiz.isActive ? "ghost" : "outline"}
                  onClick={() => handleToggle(quiz)}
                  isLoading={togglingId === quiz.id}
                  disabled={togglingId !== null && togglingId !== quiz.id}
                >
                  {quiz.isActive ? t("missions.deactivate") : t("missions.activate")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleting}
        title={t("quizzes.deleteTitle")}
        message={t("quizzes.deleteConfirm", { title: deleting?.title ?? "" })}
        isLoading={deleteQuiz.isPending}
        onConfirm={handleDelete}
        onCancel={() => !deleteQuiz.isPending && setDeleting(null)}
      />
    </div>
  );
};
