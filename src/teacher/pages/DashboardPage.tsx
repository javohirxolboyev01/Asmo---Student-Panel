// src/teacher/pages/DashboardPage.tsx
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTeacherDashboardQuery } from "@/hooks/queries/useDashboard";
import { Calendar, BookOpen, Users, ClipboardCheck } from "lucide-react";
import { SkeletonHeader, SkeletonStatGrid, SkeletonList } from "@/components/common/Skeleton";
import { Button } from "@/components/ui";
import { UpcomingLessons } from "@/components/Dashboard/UpcomingLessons";
import { getErrorMessage } from "@/lib/toast";

export const DashboardPage = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error, refetch } = useTeacherDashboardQuery();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <SkeletonStatGrid count={4} />
        <SkeletonList rows={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error ? getErrorMessage(error, t("common.error")) : t("common.error")}</p>
        <Button onClick={() => refetch()} className="mt-4">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const upcomingLessons = data.upcomingLessons.map((lesson) => ({
    id: lesson.id,
    time: lesson.time,
    groupName: lesson.groupName,
    topic: lesson.topic,
  }));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between ml-1">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t("dashboard.welcome")} <span className="text-warning">{user?.firstName}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs md:text-base">{t("dashboard.teacherSubtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/groups")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-warning" />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{data.stats.groupsCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("dashboard.statGroups")}</p>
        </div>

        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/students")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{data.stats.studentsCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("dashboard.statStudents")}</p>
        </div>

        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/attendance")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#2E7D32]" />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{data.stats.todayLessonsCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("dashboard.statTodayLessons")}</p>
        </div>

        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/grading")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#FFF3E0] rounded-full flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-[#E65100]" />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-100">{data.stats.pendingGradingCount}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t("dashboard.statPendingGrading")}</p>
        </div>
      </div>

      {upcomingLessons.length > 0 && <UpcomingLessons lessons={upcomingLessons} />}
    </div>
  );
};
