// src/components/Dashboard/UpcomingLessons.tsx
import { Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";

interface UpcomingLesson {
  id: string;
  time: string;
  groupName: string;
  topic: string;
}

interface UpcomingLessonsProps {
  lessons: UpcomingLesson[];
}

export const UpcomingLessons = ({ lessons }: UpcomingLessonsProps) => {
  const { t } = useTranslation();
  if (lessons.length === 0) {
    return (
      <div className="card">
        <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-4">
          {t("dashboardWidgets.upcomingLessons")}
        </h4>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t("dashboardWidgets.noUpcomingLessons")}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h4 className="font-medium text-gray-800 dark:text-gray-100 mb-4">
        {t("dashboardWidgets.upcomingLessons")}
      </h4>
      <div className="space-y-3">
        {lessons.map((lesson) => (
          <Link
            key={lesson.id}
            to={`/lessons/${lesson.id}`}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 dark:bg-warning/15 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                  {lesson.topic}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{lesson.time}</span>
                  <span className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full" />
                  <span>{lesson.groupName}</span>
                </div>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-warning transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
};
