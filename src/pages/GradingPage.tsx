// src/pages/GradingPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, ChevronRight } from "lucide-react";
import { teacherService } from "@/services/teacherService";
import { SubmissionWithContext } from "@/types/teacher";
import { SkeletonHeader, SkeletonTable } from "@/components/common/Skeleton";
import { Button } from "@/components/ui";
import { getAvatarUrl } from "@/lib/utils";
import { formatDateTime } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";

export const GradingPage = () => {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState<SubmissionWithContext[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    teacherService
      .getPendingSubmissions()
      .then(setSubmissions)
      .catch(() => setError(t("common.error")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <SkeletonTable rows={6} cols={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={load} className="mt-4">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
          {t("grading.title")}
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          {t("grading.subtitle", { count: submissions.length })}
        </p>
      </div>

      {submissions.length === 0 ? (
        <div className="card p-10 text-center">
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("grading.empty")}</p>
        </div>
      ) : (
        <div className="card">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {submissions.map((s) => (
              <Link
                key={s.id}
                to={`/submissions/${s.id}`}
                className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(s.student.avatar, `${s.student.firstName} ${s.student.lastName}`)}
                    alt=""
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                      {s.student.firstName} {s.student.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {s.homework.title} · {s.lesson.groupName} — {s.lesson.topic}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-gray-400 hidden sm:inline">
                    {formatDateTime(s.submittedAt)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
