import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useTeacherDashboardStore } from "@/stores/teacherDashboardStore";
import { StreakCard } from "@/components/Dashboard/StreakCard";
import { attendanceService } from "@/services/attendanceService";
import { Coins as CoinsIcon, Calendar, Trophy, BookOpen, Users, ClipboardCheck } from "lucide-react";
import {
  SkeletonHeader,
  SkeletonStatGrid,
  SkeletonList,
  Skeleton,
} from "@/components/common/Skeleton";
import { CoinLeaderboard } from "@/components/Dashboard/CoinLeaderboard";
import { CourseLevelCard } from "@/components/Dashboard/CourseLevelCard";
import { Button } from "@/components/ui";
import { UpcomingLessons } from "@/components/Dashboard/UpcomingLessons";
import type { LeaderboardFilter } from "@/components/Dashboard/CoinLeaderboard";
import type { DashboardGroup } from "@/types/notification";

// Soft diagonal gradients (not flat fills) to match the rest of the app's
// visual language (login/register logo badge, buttons); text is always
// white in CourseLevelCard, so every gradient here must stay dark/saturated
// enough for white text to stay readable.
const LEVEL_CONFIG: Record<string, { color: string; next: string | null }> = {
  Beginner: {
    color: "bg-gradient-to-br from-slate-500 to-slate-700",
    next: "Elementary",
  },
  Elementary: {
    color: "bg-gradient-to-br from-emerald-500 to-teal-600",
    next: "Pre-Intermediate",
  },
  "Pre-Intermediate": {
    color: "bg-gradient-to-br from-sky-500 to-blue-600",
    next: "Intermediate",
  },
  Intermediate: {
    color: "bg-gradient-to-br from-warning to-[#D97706]",
    next: "Basic IELTS / CEFER",
  },
  "Basic IELTS / CEFER": {
    color: "bg-gradient-to-br from-violet-500 to-purple-600",
    next: "Full IELTS",
  },
  "Full IELTS": {
    color: "bg-gradient-to-br from-rose-500 to-red-600",
    next: null,
  },
};

const getLevelFromCourse = (courseName: string): string => {
  const n = courseName.toLowerCase();
  if (n.includes("full ielts")) return "Full IELTS";
  if (n.includes("basic ielts")) return "Basic IELTS / CEFER";
  if (n.includes("pre-intermediate")) return "Pre-Intermediate";
  if (n.includes("intermediate")) return "Intermediate";
  if (n.includes("elementary")) return "Elementary";
  if (n.includes("beginner")) return "Beginner";
  return "Basic IELTS / CEFER";
};

const getGroupCourseName = (group: DashboardGroup): string =>
  group.courseName ?? group.name ?? group.groupName ?? "Kurs";

const getGroupName = (group: DashboardGroup): string =>
  group.groupName ?? group.name ?? "Guruh";

const StudentDashboard = () => {
  const data = useDashboardStore((state) => state.data);
  const isLoading = useDashboardStore((state) => state.isLoading);
  const error = useDashboardStore((state) => state.error);
  const fetchDashboard = useDashboardStore((state) => state.fetchDashboard);
  const leaderboard = useDashboardStore((state) => state.leaderboard);
  const setLeaderboardFilter = useDashboardStore((state) => state.setLeaderboardFilter);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const [attendance, setAttendance] = useState({ present: 0, total: 0 });

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    attendanceService
      .getAttendance()
      .then((result) => setAttendance({ present: result.stats.present, total: result.stats.total }))
      .catch(() => {});
  }, []);

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <Skeleton className="w-full h-32" />
        <SkeletonStatGrid count={4} />
        <Skeleton className="w-full h-40" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className={cn('card', 'p-8', 'text-center')}>
        <p className="text-red-500">{error || t("common.error")}</p>
        <Button onClick={fetchDashboard} className="mt-4">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const activeGroup = data.groups?.[0];
  const coinBalance = data.coinBalance ?? 0;

  const now = new Date();
  const coinsThisMonth = (data.recentTransactions ?? [])
    .filter((tx) => {
      if (tx.amount <= 0) return false;
      const date = new Date(tx.createdAt ?? tx.date ?? "");
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const level = activeGroup ? getLevelFromCourse(getGroupCourseName(activeGroup)) : null;
  const levelConfig = level ? LEVEL_CONFIG[level] : undefined;
  const nextLevel = levelConfig?.next ?? undefined;
  const colorClass = levelConfig?.color ?? "";
  const totalLessons = activeGroup?.totalLessons ?? 0;
  const completedLessons = activeGroup?.completedLessons ?? 0;
  const unit = `Unit ${completedLessons + 1}.${totalLessons}`;
  const week = Math.ceil(completedLessons / 2);

  const leaderboardRank = user
    ? leaderboard.students.findIndex((s) => s.id === user.id) + 1 || undefined
    : undefined;
  const streakDays = 0;

  // Avatar initials from user name
  const userAvatar = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "SZ";

  const handleLeaderboardFilter = (filter: LeaderboardFilter) => {
    setLeaderboardFilter(filter);
  };

  const upcomingLessons = (data.upcomingLessons ?? []).map((lesson) => ({
    id: lesson.id,
    time: lesson.time ?? (lesson.lessonDate ? new Date(lesson.lessonDate).toLocaleString("uz-UZ") : ""),
    groupName: lesson.groupName ?? "",
    topic: lesson.topic ?? "Dars",
  }));

  return (
    <div className={cn('space-y-4', 'md:space-y-6')}>
      {/* ── Welcome ── */}
      <div className={cn('flex', 'items-start', 'justify-between', 'ml-1')}>
        <div>
          <h1 className={cn('text-lg', 'md:text-xl', 'font-semibold', 'text-gray-800 dark:text-gray-100', 'dark:text-gray-100')}>
            {t("dashboard.welcome")}{" "}
            <span className="text-warning">{user?.firstName}</span>
          </h1>
          <p className={cn('text-gray-500', 'dark:text-gray-400', 'text-xs', 'md:text-base')}>
            {t("dashboard.subtitle")}
          </p>
        </div>
      </div>

      {/* ── Course Level ── */}
      {activeGroup ? (
        <CourseLevelCard
          level={level ?? ""}
          nextLevel={nextLevel}
          unit={unit}
          week={week}
          percentage={activeGroup.progress ?? 0}
          colorClass={colorClass}
        />
      ) : (
        <div className="card p-5 text-center text-sm text-gray-500 dark:text-gray-400">
          {t("dashboard.noGroup")}
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className={cn('grid', 'grid-cols-2', 'md:grid-cols-4', 'gap-3', 'md:gap-4')}>
        {/* Coins */}
        <div
          className={cn('card', 'p-4', 'md:p-5', 'text-center', 'cursor-pointer', 'hover:shadow-card-hover', 'transition-all', 'duration-200', 'hover:scale-[1.02]', 'active:scale-95')}
          onClick={() => navigate("/coins")}
        >
          <div className={cn('flex', 'items-center', 'justify-center', 'mb-2')}>
            <div className={cn('w-10', 'h-10', 'bg-[#FFF8E1]', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
              <CoinsIcon className={cn('w-5', 'h-5', 'text-warning')} />
            </div>
          </div>
          <p className={cn('text-lg', 'font-semibold', 'text-warning')}>
            {coinBalance}
          </p>
          <p className={cn('text-xs', 'text-gray-500', 'dark:text-gray-400')}>{t("nav.coins")}</p>
          <p className={cn('text-xs', 'text-green-600', 'mt-0.5')}>
            +{coinsThisMonth} {t("dashboard.thisMonth")}
          </p>
        </div>

        {/* Leaderboard Rank */}
        <div
          className={cn('card', 'p-4', 'md:p-5', 'text-center', 'cursor-pointer', 'hover:shadow-card-hover', 'transition-all', 'duration-200', 'hover:scale-[1.02]', 'active:scale-95')}
        >
          <div className={cn('flex', 'items-center', 'justify-center', 'mb-2')}>
            <div className={cn('w-10', 'h-10', 'bg-purple-50', 'dark:bg-purple-500/10', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
              <Trophy className={cn('w-5', 'h-5', 'text-purple-600', 'dark:text-purple-400')} />
            </div>
          </div>
          <p className={cn('text-lg', 'font-semibold', 'text-gray-800 dark:text-gray-100', 'dark:text-gray-100')}>
            {leaderboardRank ?? "-"}
          </p>
          <p className={cn('text-xs', 'text-gray-500', 'dark:text-gray-400')}>{t("dashboard.rank")}</p>
        </div>

        {/* Attendance */}
        <div
          className={cn('card', 'p-4', 'md:p-5', 'text-center', 'cursor-pointer', 'hover:shadow-card-hover', 'transition-all', 'duration-200', 'hover:scale-[1.02]', 'active:scale-95')}
          onClick={() => navigate("/attendance")}
        >
          <div className={cn('flex', 'items-center', 'justify-center', 'mb-2')}>
            <div className={cn('w-10', 'h-10', 'bg-[#E8F5E9]', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
              <Calendar className={cn('w-5', 'h-5', 'text-[#2E7D32]')} />
            </div>
          </div>
          <p className={cn('text-lg', 'font-semibold', 'text-gray-800 dark:text-gray-100', 'dark:text-gray-100')}>
            {attendance.present} {t("dashboard.days")}
          </p>
          <p className={cn('text-xs', 'text-gray-500', 'dark:text-gray-400')}>{t("dashboard.attendedDays")}</p>
          <p className={cn('text-xs', 'text-gray-400', 'mt-0.5')}>{t("dashboard.totalDays")} {attendance.total} {t("dashboard.days")}</p>
        </div>

        {/* Streak */}
        <StreakCard streakDays={streakDays} />
      </div>

      {upcomingLessons.length > 0 && <UpcomingLessons lessons={upcomingLessons} />}

      <CoinLeaderboard
        students={leaderboard.students}
        currentUserId={user?.id}
        currentUserRank={leaderboardRank}
        currentUserCoins={coinBalance}
        currentUserStreak={streakDays}
        currentUserName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
        currentUserGroup={activeGroup ? getGroupName(activeGroup) : undefined}
        currentUserAvatar={userAvatar}
        filter={leaderboard.filter}
        onFilterChange={handleLeaderboardFilter}
        isLoading={leaderboard.isLeaderboardLoading}
      />
    </div>
  );
};

const TeacherDashboard = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const data = useTeacherDashboardStore((state) => state.data);
  const isLoading = useTeacherDashboardStore((state) => state.isLoading);
  const error = useTeacherDashboardStore((state) => state.error);
  const fetchDashboard = useTeacherDashboardStore((state) => state.fetchDashboard);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
        <p className="text-red-500">{error || t("common.error")}</p>
        <Button onClick={fetchDashboard} className="mt-4">
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

export const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  return isTeacher ? <TeacherDashboard /> : <StudentDashboard />;
};
