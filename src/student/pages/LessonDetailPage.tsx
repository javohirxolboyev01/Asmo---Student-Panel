// src/student/pages/LessonDetailPage.tsx

import { cn } from "@/lib/utils";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { isOverdue } from "@/utilist/calculateDeadline";
import { useLessonDetailQuery, useSubmitHomeworkMutation } from "@/hooks/queries/useLessons";
import { useParams } from "react-router-dom";
import { formatDateTime } from "@/utilist//formatData";
import { Skeleton, SkeletonCard } from "@/components/common/Skeleton";
import { Upload, Check, Paperclip, X, FileText, CheckCircle2, AlertTriangle, Clock, Hourglass } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { toast, getErrorMessage } from "@/lib/toast";
import { Button, IconButton, Textarea } from "@/components/ui";
import { LessonHeaderCard } from "@/components/Lesson/LessonHeaderCard";

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export const LessonDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useLessonDetailQuery(id);
  const submitHomework = useSubmitHomeworkMutation(id ?? "");
  const [submissionContent, setSubmissionContent] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadedSubmission = data?.submission;
    if (loadedSubmission && loadedSubmission.status !== "graded") {
      setSubmissionContent(loadedSubmission.content ?? "");
    }
  }, [data]);

  const handleSubmit = async () => {
    if (!data || !data.homework || !submissionContent.trim() || !id) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await submitHomework.mutateAsync({
        homeworkId: data.homework.id,
        content: submissionContent,
        attachmentUrl: pendingAttachment?.dataUrl,
      });
      setSubmitMessage({
        type: "success",
        text: t("lessonDetail.submitSuccess"),
      });
      toast.success(t("lessonDetail.submitSuccess"));
      setPendingAttachment(null);
    } catch (err) {
      setSubmitMessage({
        type: "error",
        text: t("lessonDetail.submitError"),
      });
      toast.error(getErrorMessage(err, t("lessonDetail.submitError")));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      toast.error(t("lessonDetail.attachmentTooLarge"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPendingAttachment({ name: file.name, dataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="w-32 h-4" />
        <div className="card p-5 md:p-6 space-y-3">
          <Skeleton className="w-24 h-5 rounded-full" />
          <Skeleton className="w-2/3 h-7" />
          <Skeleton className="w-1/3 h-4" />
        </div>
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (error || !data || !data.lesson) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error ? getErrorMessage(error, t("lessonDetail.notFound")) : t("lessonDetail.notFound")}</p>
      </div>
    );
  }

  const { lesson, homework, submission } = data;
  const overdue = homework ? isOverdue(homework.deadline) : false;
  const canSubmit =
    homework &&
    homework.status === "active" &&
    !overdue &&
    (!submission || submission.status !== "graded");

  return (
    <div className="space-y-4 md:space-y-6">
      <LessonHeaderCard
        lesson={lesson}
        aside={
          submission && submission.status === "graded" && (
            <div className="bg-[#E8F5E9] dark:bg-[#2E7D32]/15 px-4 py-2 rounded-2xl">
              <span className="text-lg font-bold text-[#2E7D32]">
                {submission.score}
              </span>
              <span className="text-sm text-[#2E7D32]/70">
                /{homework?.maxScore}
              </span>
            </div>
          )
        }
      />

      {homework && (
        <div className="card">
          <div className="p-5 md:p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-warning" />
              {t("lessonDetail.homeworkTitle")}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left - Homework Info */}
              <div>
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
                  {homework.title}
                </h3>
                <p className="text-gray-500 text-sm whitespace-pre-wrap leading-relaxed">
                  {homework.description}
                </p>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <span className="text-gray-500">
                    {t("lessonDetail.deadlineLabel", {
                      date: formatDateTime(homework.deadline),
                    })}
                  </span>
                  {submission && submission.status === "graded" && (
                    <span className="text-[#2E7D32] font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t("lessonDetail.graded")}
                    </span>
                  )}
                </div>
              </div>

              {/* Right - Score */}
              <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-white/5 rounded-2xl p-6 min-h-[120px]">
                {submission && submission.status === "graded" ? (
                  <div className="text-center">
                    <span className="text-5xl font-bold text-warning">
                      {submission.score}
                    </span>
                    <span className="text-gray-400 text-xl">
                      {" "}
                      / {homework.maxScore}
                    </span>
                    {submission.feedback && (
                      <p className="text-sm text-gray-500 mt-2 max-w-xs">
                        {submission.feedback}
                      </p>
                    )}
                  </div>
                ) : submission && submission.status === "submitted" ? (
                  <div className="text-center">
                    <Hourglass className="w-9 h-9 text-warning mx-auto mb-2" />
                    <p className="text-gray-500">{t("lessonDetail.waiting")}</p>
                    <p className="text-sm text-gray-400">{t("lessonDetail.checking")}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-4xl text-gray-300">0</span>
                    <span className="text-gray-300 text-xl">
                      {" "}
                      / {homework.maxScore}
                    </span>
                    <p className="text-sm text-gray-400 mt-2">
                      {t("lessonDetail.notSubmittedYet")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Deadline Alert */}
            {overdue && homework.status !== "closed" && (
              <div className="mt-4 bg-red-500 text-white p-4 rounded-2xl font-bold text-center flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {t("lessonDetail.overdue")}
              </div>
            )}

            {!overdue && homework.status === "active" && !submission && (
              <div className="mt-4 bg-[#FFF3E0] dark:bg-[#E65100]/15 text-[#E65100] p-4 rounded-2xl font-medium text-center flex items-center justify-center gap-2">
                <Clock className="w-4 h-4" />
                {t("lessonDetail.hoursLeft")}
              </div>
            )}

            {/* Your answer (always visible once submitted, regardless of grading state) */}
            {submission && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">
                  {t("lessonDetail.yourAnswerTitle")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-white/5 rounded-2xl p-4">
                  {submission.content}
                </p>
                {submission.attachmentUrl && (
                  <a
                    href={submission.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-warning hover:underline"
                  >
                    {t("lessonDetail.attachmentLabel")}
                  </a>
                )}
              </div>
            )}

            {/* Submission */}
            {canSubmit && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-3">
                  {submission ? t("lessonDetail.editTitle") : t("lessonDetail.submitTitle")}
                </h3>
                <Textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  placeholder={t("lessonDetail.submitPlaceholder")}
                  className="min-h-[120px]"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {pendingAttachment && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                    <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{pendingAttachment.name}</span>
                    <IconButton
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => setPendingAttachment(null)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <Button variant="outline" size="md" leftIcon={<Upload className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()} type="button">
                    {t("lessonDetail.uploadFile")}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!submissionContent.trim()}
                    isLoading={isSubmitting}
                    leftIcon={<Check className="w-4 h-4" />}
                  >
                    {submission ? t("lessonDetail.resubmit") : t("lessonDetail.submit")}
                  </Button>
                </div>
                {submitMessage && (
                  <div
                    className={cn(
                      "mt-3 p-3 rounded-2xl text-sm",
                      submitMessage.type === "success"
                        ? "bg-[#E8F5E9] dark:bg-[#2E7D32]/15 text-[#2E7D32]"
                        : "bg-[#FFEBEE] dark:bg-[#C62828]/15 text-[#C62828]",
                    )}
                  >
                    {submitMessage.text}
                  </div>
                )}
              </div>
            )}

            {submission && submission.status === "graded" && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-[#2E7D32] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {t("lessonDetail.gradedFooter", {
                    score: submission.score,
                    max: homework.maxScore,
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};