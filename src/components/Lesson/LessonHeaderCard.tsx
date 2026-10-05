// src/components/Lesson/LessonHeaderCard.tsx
import { ReactNode } from "react";
import { Calendar, User } from "lucide-react";
import { formatDate } from "@/utilist//formatData";
import { useTranslation } from "@/hooks/useTranslation";
import type { lessonService } from "@/services/lessonService";

type LessonInfo = Awaited<ReturnType<typeof lessonService.getLesson>>["lesson"];

// Lesson card of the teacher lesson page (mock `lesson` view): date + group
// chips, the topic as h1, then `children` (the homework block). `aside` is
// rendered on the right of the title.
export const LessonHeaderCard = ({
  lesson,
  aside,
  children,
}: {
  lesson: LessonInfo;
  aside?: ReactNode;
  children?: ReactNode;
}) => {
  const { t } = useTranslation();

  return (
    <div className="u-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="u-chip">
          <Calendar className="u-i s" strokeWidth={2} aria-hidden="true" />
          {formatDate(lesson.lessonDate)}
        </span>
        <span className="u-chip">{lesson.groupName}</span>
        {lesson.lessonOrder ? (
          <span className="u-chip">{t("lessonDetail.lessonNumber", { order: lesson.lessonOrder })}</span>
        ) : null}
        {lesson.teacherName && (
          <span className="u-chip">
            <User className="u-i s" strokeWidth={2} aria-hidden="true" />
            {lesson.teacherName}
          </span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h1 className="mt-3 mb-1 break-words min-w-0">{lesson.topic}</h1>
        {aside}
      </div>
      {lesson.description && <p className="u-sub whitespace-pre-wrap break-words">{lesson.description}</p>}
      {children}
    </div>
  );
};
