// src/pages/DashboardPage.tsx
import { useEffect } from "react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Clock,
  Bell,
  Coins as CoinsIcon,
  Calendar,
  Trophy,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { cn } from "@/lib/utils";
import { CourseLevelCard } from "@/components/Dashboard/CourseLevelCard";
import { StreakCard } from "@/components/Dashboard/StreakCard";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

// Level configuration
const LEVEL_CONFIG: Record<
  string,
  {
    color: string;
    next: string | null;
  }
> = {
  Beginner: {
    color: "bg-slate-600 border-slate-700 text-slate-800",
    next: "Elementary",
  },
  Elementary: {
    color: "bg-emerald-500 border-emerald-400 text-white",
    next: "Pre-Intermediate",
  },
  "Pre-Intermediate": {
    color: "bg-blue-500 border-blue-500 text-white",
    next: "Intermediate",
  },
  Intermediate: {
    color: "bg-orange-500 border-orange-500 text-white",
    next: "Basic IELTS / CEFER",
  },
  "Basic IELTS / CEFER": {
    color: "bg-purple-500 border-purple-500 text-white",
    next: "Full IELTS",
  },
  "Full IELTS": {
    color: "bg-red-600 border-red-500 text-white",
    next: null,
  },
};

const getLevelFromCourse = (courseName: string): string => {
  const normalized = courseName.toLowerCase();
  if (normalized.includes("full ielts")) return "Full IELTS";
  if (normalized.includes("basic ielts")) return "Basic IELTS / CEFER";
  if (normalized.includes("pre-intermediate")) return "Pre-Intermediate";
  if (normalized.includes("intermediate")) return "Intermediate";
  if (normalized.includes("elementary")) return "Elementary";
  if (normalized.includes("beginner")) return "Beginner";
  return "Pre-Intermediate";
};

export const DashboardPage = () => {
  const { data, isLoading, error, fetchDashboard } = useDashboardStore();
  const { setNotifications } = useNotificationStore();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    if (data?.notifications) {
      setNotifications(data.notifications);
    }
  }, [data, setNotifications]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Yuklanmoqda..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error || "Xatolik yuz berdi"}</p>
        <button onClick={fetchDashboard} className="btn-primary mt-4">
          Qayta urinish
        </button>
      </div>
    );
  }

  const { activeCourse, coins, upcomingLessons, notifications } = data;

  const level = getLevelFromCourse(activeCourse.courseName);
  const levelConfig = LEVEL_CONFIG[level];
  const nextLevel = levelConfig?.next || undefined;
  const colorClass = levelConfig?.color || "";
  const unit = `Unit ${activeCourse.completedLessons + 1}.${activeCourse.totalLessons}`;
  const week = Math.ceil(activeCourse.completedLessons / 2);

  // Mock data for stats
  const totalAttendanceDays = 17;
  const leaderboardRank = 3;
  const streakDays = 7;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className="flex items-start justify-between ml-1">
        <div>
          <h1 className="text-xl md:text-3xl font-semibold text-[#1A1D26]">
            Xush kelibsiz!{" "}
            <span className="text-[#F59E0B]">{user?.firstName}</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-base">
            Bugungi maqsadlaringizni amalga oshirishga tayyormisiz?
          </p>
        </div>
      </div>

      {/* Course Level Card */}
      <CourseLevelCard
        level={level}
        nextLevel={nextLevel}
        unit={unit}
        week={week}
        percentage={activeCourse.progress}
        colorClass={colorClass}
      />

      {/* Stats Grid - 4 columns */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* 1. Coins */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/coins")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#FFF8E1] rounded-full flex items-center justify-center">
              <CoinsIcon className="w-5 h-5 text-[#F59E0B]" />
            </div>
          </div>
          <p className="text-xl font-semibold text-[#F59E0B]">
            {coins.balance}
          </p>
          <p className="text-xs text-gray-500">Coin</p>
          <p className="text-xs text-green-600 mt-0.5">
            +{coins.thisMonth} bu oy
          </p>
        </div>

        {/* 2. Leaderboard Rank */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/profile")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xl font-semibold text-[#1A1D26]">
            #{leaderboardRank}
          </p>
          <p className="text-xs text-gray-500">Reyting</p>
          <p className="text-xs text-gray-400 mt-0.5">Top 10% da</p>
        </div>

        {/* 3. Attendance Days */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/attendance")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#2E7D32]" />
            </div>
          </div>
          <p className="text-xl font-semibold text-[#1A1D26]">
            {totalAttendanceDays} {""} kun
          </p>
          <p className="text-xs text-gray-500">Qatnashgan kun</p>
          <p className="text-xs text-gray-400 mt-0.5">Jami 20 kun</p>
        </div>

        {/* 4. Streak with Day/Night Animation */}
        <StreakCard
          streakDays={streakDays}
          onClick={() => navigate("/attendance")}
        />
      </div>

      {/* Upcoming Lessons */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-[#1A1D26]">Tez oradagi darslar</h3>
          <span
            className="text-xs text-[#2D6BFF] font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/groups")}
          >
            Yana
          </span>
        </div>
        <div className="card-body space-y-3">
          {upcomingLessons.map((lesson) => (
            <div
              key={lesson.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => navigate(`/lessons/${lesson.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2D6BFF]/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#2D6BFF]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1A1D26]">
                    {lesson.topic}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{lesson.time}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{lesson.groupName}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Preview */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-[#1A1D26]">Xabarlar</h3>
          </div>
          <span
            className="text-xs text-[#2D6BFF] font-medium cursor-pointer hover:underline"
            onClick={() => navigate("/notifications")}
          >
            Barchasi
          </span>
        </div>
        <div className="card-body space-y-3">
          {notifications.slice(0, 2).map((notif) => (
            <div
              key={notif.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => navigate("/notifications")}
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  !notif.isRead ? "bg-[#2D6BFF]" : "bg-gray-300",
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#1A1D26]">
                  {notif.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {notif.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
