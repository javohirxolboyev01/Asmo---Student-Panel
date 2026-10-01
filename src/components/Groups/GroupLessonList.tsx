// src/components/Groups/GroupLessonList.tsx
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utilist/formatData";
import { useTranslation } from "@/hooks/useTranslation";
import type { LessonListItem } from "@/types/lesson";

// Lesson cards of a group, shared by the student and teacher group pages.
export const GroupLessonList = ({ lessons }: { lessons: LessonListItem[] }) => {
  const { t } = useTranslation();

  return (
    <div
      className={
        lessons.length === 0
          ? ""
          : "grid grid-cols-1 lg:grid-cols-2 gap-3"
      }
    >
      {lessons.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm text-gray-400">{t("groupDetail.noLessons")}</p>
        </div>
      ) : (
        lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/lessons/${lesson.id}`}
            className="card block hover:shadow-md transition-shadow duration-200"
          >
            {/* ── Row: Mavzu ── */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("groupDetail.topics")}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right max-w-[60%] truncate">
                {lesson.topic}
              </span>
            </div>

            {/* ── Row: Uyga vazifa holati ── */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("groupDetail.homeworkStatus")}
              </span>
              {lesson.homework ? (
                <span
                  className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full",
                    lesson.homework.isOverdue
                      ? "bg-[#FFEBEE] dark:bg-[#C62828]/15 text-[#C62828]"
                      : "bg-warning/10 text-warning",
                  )}
                >
                  {t("groupDetail.hasHomework")}
                </span>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>

            {/* ── Row: Uyga vazifa tugash vaqti ── */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("groupDetail.homeworkDeadline")}
              </span>
              {lesson.homework?.deadline ? (
                <span
                  className={cn(
                    "text-sm font-medium",
                    lesson.homework.isOverdue
                      ? "text-red-500"
                      : "text-gray-600 dark:text-gray-300",
                  )}
                >
                  {formatDate(lesson.homework.deadline)}
                </span>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>

            {/* ── Row: Dars sanasi ── */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {t("groupDetail.lessonDate")}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {formatDate(lesson.lessonDate)}
              </span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
};
