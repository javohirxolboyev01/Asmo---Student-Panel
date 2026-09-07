// src/pages/LessonDetailPage.tsx

import { cn } from "@/lib/utils";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { isOverdue } from "@/utilist/calculateDeadline";
import { lessonService } from "@/services/lessonService";
import { teacherService } from "@/services/teacherService";
import { useNavigate, useParams } from "react-router-dom";
import { formatDate, formatDateTime } from "@/utilist//formatData";
import { Skeleton, SkeletonCard } from "@/components/common/Skeleton";
import { Calendar, User, Upload, Check, Paperclip, X, FileText, CheckCircle2, AlertTriangle, Clock, Hourglass, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/authStore";
import { StatusBadge } from "@/components/common/StatusBadge";
import { WeeklyAttendanceTable } from "@/components/Lesson/WeeklyAttendanceTable";
import { LessonRosterEntry } from "@/types/teacher";
import { toast, getErrorMessage } from "@/lib/toast";
import { Button, IconButton, Input, Textarea } from "@/components/ui";

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

const RosterTableRow = ({
  student,
  onOpen,
}: {
  student: LessonRosterEntry;
  onOpen: (submissionId: string) => void;
}) => {
  const { t } = useTranslation();
  const clickable = !!student.submission;

  return (
    <tr
      className={cn(
        "border-b border-gray-100 dark:border-gray-800 last:border-b-0",
        clickable && "cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors",
      )}
      onClick={clickable ? () => onOpen(student.submission!.id) : undefined}
    >
      <td className="py-3 pr-3 whitespace-nowrap">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {student.firstName} {student.lastName}
        </span>
      </td>
      <td className="py-3 pr-3 whitespace-nowrap">
        {student.submission ? (
          <StatusBadge status={student.submission.status} />
        ) : (
          <span className="text-xs text-gray-400">{t("lessonDetail.noSubmissionYet")}</span>
        )}
      </td>
      <td className="py-3 pr-3 whitespace-nowrap">
        {student.submission?.status === "graded" ? (
          <span className="text-sm font-semibold text-warning">{student.submission.score}</span>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>
      <td className="py-3 pl-3 text-right">
        {clickable && <ChevronRight className="w-4 h-4 text-gray-400 inline-block" />}
      </td>
    </tr>
  );
};

export const LessonDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [pendingAttachment, setPendingAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [homeworkForm, setHomeworkForm] = useState({ title: "", description: "", maxScore: "100", deadline: "" });
  const [isSavingHomework, setIsSavingHomework] = useState(false);

  const loadLesson = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const lessonData = await lessonService.getLesson(id);
      setData(lessonData);
      const loadedSubmission = (lessonData as any).submission;
      if (loadedSubmission && loadedSubmission.status !== "graded") {
        setSubmissionContent(loadedSubmission.content ?? "");
      }
    } catch (err) {
      setError(t("lessonDetail.loadError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLesson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async () => {
    if (!data || !submissionContent.trim() || !id) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      await lessonService.submitHomework(data.homework.id, submissionContent, pendingAttachment?.dataUrl);
      setSubmitMessage({
        type: "success",
        text: t("lessonDetail.submitSuccess"),
      });
      toast.success(t("lessonDetail.submitSuccess"));
      setPendingAttachment(null);
      await loadLesson();
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

  const handleCreateHomework = async () => {
    if (!id || !homeworkForm.title || !homeworkForm.description || !homeworkForm.deadline) return;
    setIsSavingHomework(true);
    try {
      await teacherService.createHomework(id, {
        title: homeworkForm.title,
        description: homeworkForm.description,
        maxScore: Number(homeworkForm.maxScore) || undefined,
        deadline: homeworkForm.deadline,
      });
      await loadLesson();
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSavingHomework(false);
    }
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
        <p className="text-red-500">{error || t("lessonDetail.notFound")}</p>
      </div>
    );
  }

  const { lesson, homework, submission } = data;
  const roster: LessonRosterEntry[] = data.roster ?? [];
  const overdue = homework ? isOverdue(homework.deadline) : false;
  const canSubmit =
    homework &&
    homework.status === "active" &&
    !overdue &&
    (!submission || submission.status !== "graded");

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Lesson Header */}
      <div className="card">
        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 rounded-full">
                  {t("lessonDetail.lessonNumber", { order: lesson.lessonOrder })}
                </span>
                <span className="text-xs font-medium px-2.5 py-1 bg-warning/10 text-warning rounded-full">
                  {lesson.groupName}
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
                {lesson.topic}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(lesson.lessonDate)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span>{lesson.teacherName}</span>
                </div>
              </div>
            </div>
            {!isTeacher && submission && submission.status === "graded" && (
              <div className="bg-[#E8F5E9] dark:bg-[#2E7D32]/15 px-4 py-2 rounded-2xl">
                <span className="text-lg font-bold text-[#2E7D32]">
                  {submission.score}
                </span>
                <span className="text-sm text-[#2E7D32]/70">
                  /{homework.maxScore}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isTeacher ? (
        <>
          {/* Homework (teacher) */}
          <div className="card p-5 md:p-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-warning" />
              {t("lessonDetail.homeworkTitle")}
            </h2>
            {homework ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-800 dark:text-gray-100">{homework.title}</p>
                <p className="text-gray-500 whitespace-pre-wrap">{homework.description}</p>
                <p className="text-gray-400 mt-2">
                  {t("lessonDetail.deadlineLabel", { date: formatDateTime(homework.deadline) })} · {t("lessonDetail.maxScoreLabel")}: {homework.maxScore}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder={t("lessonDetail.homeworkTitleLabel")}
                  value={homeworkForm.title}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
                />
                <Textarea
                  placeholder={t("lessonDetail.homeworkDescLabel")}
                  value={homeworkForm.description}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                  className="min-h-[90px]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="number"
                    placeholder={t("lessonDetail.maxScoreLabel")}
                    value={homeworkForm.maxScore}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, maxScore: e.target.value })}
                  />
                  <Input
                    type="datetime-local"
                    value={homeworkForm.deadline}
                    onChange={(e) => setHomeworkForm({ ...homeworkForm, deadline: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateHomework} isLoading={isSavingHomework} size="sm">
                  {t("lessonDetail.createHomework")}
                </Button>
              </div>
            )}
          </div>

          {/* Grading roster (teacher) */}
          {homework && (
            <div className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {t("lessonDetail.rosterTitle")}
                </h2>
                {roster.length > 0 && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                    {t("lessonDetail.rosterSummary", {
                      submitted: roster.filter((s) => s.submission).length,
                      total: roster.length,
                      graded: roster.filter((s) => s.submission?.status === "graded").length,
                    })}
                  </span>
                )}
              </div>
              {roster.length === 0 ? (
                <p className="text-sm text-gray-400">{t("groupDetail.noStudents")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400">
                        <th className="py-2 pr-3 font-medium">{t("students.studentLabel")}</th>
                        <th className="py-2 pr-3 font-medium">{t("students.status")}</th>
                        <th className="py-2 pr-3 font-medium">{t("lessonDetail.scoreLabel")}</th>
                        <th className="py-2 pl-3 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((student) => (
                        <RosterTableRow
                          key={student.id}
                          student={student}
                          onOpen={(submissionId) => navigate(`/submissions/${submissionId}`)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Attendance (teacher) */}
          <div className="card p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              {t("lessonDetail.attendanceTitle")}
            </h2>
            <WeeklyAttendanceTable groupId={lesson.groupId} referenceDate={lesson.lessonDate} />
          </div>
        </>
      ) : (
        homework && (
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
        )
      )}
    </div>
  );
};
