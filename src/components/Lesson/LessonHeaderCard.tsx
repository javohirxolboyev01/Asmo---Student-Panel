// src/components/Lesson/LessonHeaderCard.tsx
import { ReactNode } from "react";
import { Calendar, User } from "lucide-react";
import { formatDate } from "@/utilist//formatData";
import { useTranslation } from "@/hooks/useTranslation";
import type { lessonService } from "@/services/lessonService";

type LessonInfo = Awaited<ReturnType<typeof lessonService.getLesson>>["lesson"];

// Lesson title card shared by the student and teacher lesson pages; `aside`
// is rendered on the right (the student's grade badge).
export const LessonHeaderCard = ({ lesson, aside }: { lesson: LessonInfo; aside?: ReactNode }) => {
  const { t } = useTranslation();

  return (
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
          {aside}
        </div>
      </div>
    </div>
  );
};
