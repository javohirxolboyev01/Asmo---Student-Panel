// src/teacher/pages/LessonDetailPage.tsx

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLessonDetailQuery, useCreateHomeworkMutation } from "@/hooks/queries/useLessons";
import { useNavigate, useParams } from "react-router-dom";
import { formatDateTime } from "@/utilist//formatData";
import { Skeleton, SkeletonCard } from "@/components/common/Skeleton";
import { FileText, ChevronRight } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { WeeklyAttendanceTable } from "@/components/Lesson/WeeklyAttendanceTable";
import { LessonRosterEntry } from "@/types/teacher";
import { toast, getErrorMessage } from "@/lib/toast";
import { Button, Input, Textarea } from "@/components/ui";
import { LessonHeaderCard } from "@/components/Lesson/LessonHeaderCard";

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
  const { data, isLoading, error } = useLessonDetailQuery(id);
  const createHomework = useCreateHomeworkMutation(id ?? "");

  const [homeworkForm, setHomeworkForm] = useState({ title: "", description: "", maxScore: "100", deadline: "" });
  const [isSavingHomework, setIsSavingHomework] = useState(false);

  const handleCreateHomework = async () => {
    if (!id || !homeworkForm.title || !homeworkForm.description || !homeworkForm.deadline) return;
    setIsSavingHomework(true);
    try {
      await createHomework.mutateAsync({
        title: homeworkForm.title,
        description: homeworkForm.description,
        maxScore: Number(homeworkForm.maxScore) || undefined,
        deadline: homeworkForm.deadline,
      });
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
        <p className="text-red-500">{error ? getErrorMessage(error, t("lessonDetail.notFound")) : t("lessonDetail.notFound")}</p>
      </div>
    );
  }

  const { lesson, homework } = data;
  const roster: LessonRosterEntry[] = data.roster ?? [];

  return (
    <div className="space-y-4 md:space-y-6">
      <LessonHeaderCard lesson={lesson} />

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
    </div>
  );
};