// src/components/Dashboard/UpcomingLessons.tsx
// Teacher home: the next scheduled lessons as mock `.les` rows
// (date box, topic, group · time) linking to the lesson page.
import { Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { DateBox, SectionHead } from "@/teacher/components/ui";

export interface UpcomingLesson {
  id: string;
  topic: string;
  lessonDate: string;
  groupName: string;
}

const hhmm = (date: string) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? ""
    : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export const UpcomingLessons = ({ lessons, className }: { lessons: UpcomingLesson[]; className?: string }) => {
  const { t } = useTranslation();
  if (lessons.length === 0) return null;

  return (
    <section className={className}>
      <SectionHead title={t("dashboardWidgets.upcomingLessons")} />
      <div className="u-cols u-stack">
        {lessons.map((lesson) => (
          <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="u-les">
            <DateBox date={lesson.lessonDate} />
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[17px]">{lesson.topic}</b>
              <span className="flex min-w-0 items-center gap-1.5 text-sm text-u-mu">
                <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />
                {hhmm(lesson.lessonDate)}
                <span aria-hidden="true">·</span>
                <span className="truncate">{lesson.groupName}</span>
              </span>
            </div>
            <ChevronRight className="u-i m text-u-mu" strokeWidth={2} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
};
