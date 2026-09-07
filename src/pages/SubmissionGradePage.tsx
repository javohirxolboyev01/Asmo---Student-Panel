// src/pages/SubmissionGradePage.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, CheckCircle2, FileText, Paperclip, User } from "lucide-react";
import { teacherService } from "@/services/teacherService";
import { SubmissionWithContext } from "@/types/teacher";
import { Skeleton, SkeletonCard } from "@/components/common/Skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button, Input } from "@/components/ui";
import { getAvatarUrl } from "@/lib/utils";
import { formatDateTime } from "@/utilist/formatData";
import { toast, getErrorMessage } from "@/lib/toast";
import { useTranslation } from "@/hooks/useTranslation";

export const SubmissionGradePage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<SubmissionWithContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    teacherService
      .getSubmission(id)
      .then((data) => {
        setSubmission(data);
        setScore(data.score !== null ? String(data.score) : "");
        setFeedback(data.feedback ?? "");
      })
      .catch(() => setError(t("grading.loadError")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleGrade = async () => {
    if (!id || score === "") return;
    setIsSubmitting(true);
    try {
      await teacherService.gradeSubmission(id, {
        score: Number(score),
        feedback: feedback || undefined,
      });
      toast.success(t("common.updateSuccess"));
      navigate(-1);
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="w-32 h-4" />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error || t("grading.notFound")}</p>
        <Button onClick={() => navigate("/grading")} className="mt-4">
          {t("grading.backToGrading")}
        </Button>
      </div>
    );
  }

  const { student, homework, lesson } = submission;

  return (
    <div className="space-y-4 md:space-y-6 lg:max-w-3xl lg:mx-auto">

      <div className="card p-5 md:p-6">
        <div className="flex items-center gap-3">
          <img
            src={getAvatarUrl(student.avatar, `${student.firstName} ${student.lastName}`)}
            alt=""
            className="w-14 h-14 rounded-full"
          />
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
              {student.firstName} {student.lastName}
            </h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> {lesson.groupName}
            </p>
          </div>
          <div className="ml-auto">
            <StatusBadge status={submission.status} />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <p className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-warning" />
            {homework.title}
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {t("lessonDetail.deadlineLabel", { date: formatDateTime(homework.deadline) })} ·{" "}
            {t("lessonDetail.maxScoreLabel")}: {homework.maxScore}
          </p>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
          {t("lessonDetail.yourAnswerTitle")}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
          {submission.content}
        </p>
        <p className="text-xs text-gray-400 mt-2">{formatDateTime(submission.submittedAt)}</p>
        {submission.attachmentUrl && (
          <a
            href={submission.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-sm text-warning hover:underline"
          >
            <Paperclip className="w-3.5 h-3.5" />
            {t("lessonDetail.attachmentLabel")}
          </a>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
          {t("lessonDetail.gradeTitle")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3">
          <Input
            type="number"
            min={0}
            max={homework.maxScore}
            label={t("lessonDetail.scoreLabel")}
            placeholder={`0 - ${homework.maxScore}`}
            value={score}
            onChange={(e) => setScore(e.target.value)}
          />
          <Input
            type="text"
            label={t("lessonDetail.feedbackLabel")}
            placeholder={t("lessonDetail.feedbackLabel")}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        <Button
          onClick={handleGrade}
          isLoading={isSubmitting}
          disabled={score === ""}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
          className="mt-4"
        >
          {t("lessonDetail.gradeSubmit")}
        </Button>
      </div>
    </div>
  );
};
