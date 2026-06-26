import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { StreakCard } from "@/components/Dashboard/StreakCard";
import { useNotificationStore } from "@/stores/notificationStore";
import { Coins as CoinsIcon, Calendar, Trophy } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CoinLeaderboard } from "@/components/Dashboard/CoinLeaderboard";
import { CourseLevelCard } from "@/components/Dashboard/CourseLevelCard";
import type { LeaderboardFilter } from "@/components/Dashboard/CoinLeaderboard";

const LEVEL_CONFIG: Record<string, { color: string; next: string | null }> = {
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
    color: "bg-[#F59E0B] border-[#F59E0B] text-white",
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
  const n = courseName.toLowerCase();
  if (n.includes("full ielts")) return "Full IELTS";
  if (n.includes("basic ielts")) return "Basic IELTS / CEFER";
  if (n.includes("pre-intermediate")) return "Pre-Intermediate";
  if (n.includes("intermediate")) return "Intermediate";
  if (n.includes("elementary")) return "Elementary";
  if (n.includes("beginner")) return "Beginner";
  return "Basic IELTS / CEFER";
};

// ─── Page ────────────────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const {
    data,
    isLoading,
    error,
    fetchDashboard,
    leaderboard,
    setLeaderboardFilter,
  } = useDashboardStore();
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

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Yuklanmoqda..." />
      </div>
    );
  }

  // ── Error ──
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

  const { activeCourse, coins } = data;

  const level = getLevelFromCourse(activeCourse.courseName);
  const levelConfig = LEVEL_CONFIG[level];
  const nextLevel = levelConfig?.next ?? undefined;
  const colorClass = levelConfig?.color ?? "";
  const unit = `Unit ${activeCourse.completedLessons + 1}.${activeCourse.totalLessons}`;
  const week = Math.ceil(activeCourse.completedLessons / 2);

  // TODO: real data from backend
  const totalAttendanceDays = 17;
  const leaderboardRank = 3;
  const streakDays = 7;

  // Avatar initials from user name
  const userAvatar = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "SZ";

  const handleLeaderboardFilter = (filter: LeaderboardFilter) => {
    setLeaderboardFilter(filter);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── Welcome ── */}
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

      {/* ── Course Level ── */}
      <CourseLevelCard
        level={level}
        nextLevel={nextLevel}
        unit={unit}
        week={week}
        percentage={activeCourse.progress}
        colorClass={colorClass}
      />

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Coins */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/coins")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#FFF8E1] rounded-full flex items-center justify-center">
              <CoinsIcon className="w-5 h-5 text-[#F59E0B]" />
            </div>
          </div>
          <p className="text-lg font-semibold text-[#F59E0B]">
            {coins.balance}
          </p>
          <p className="text-xs text-gray-500">Coin</p>
          <p className="text-xs text-green-600 mt-0.5">
            +{coins.thisMonth} bu oy
          </p>
        </div>

        {/* Leaderboard Rank */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/leaderboard")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-lg font-semibold text-[#1A1D26]">
            {leaderboardRank}
          </p>
          <p className="text-xs text-gray-500">Reyting</p>
          <p className="text-xs text-gray-400 mt-0.5">Top 10% da</p>
        </div>

        {/* Attendance */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/attendance")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#2E7D32]" />
            </div>
          </div>
          <p className="text-lg font-semibold text-[#1A1D26]">
            {totalAttendanceDays} kun
          </p>
          <p className="text-xs text-gray-500">Qatnashgan kun</p>
          <p className="text-xs text-gray-400 mt-0.5">Jami 20 kun</p>
        </div>

        {/* Streak */}
        <StreakCard
          streakDays={streakDays}
          onClick={() => navigate("/attendance")}
        />
      </div>

      <CoinLeaderboard
        students={leaderboard.students}
        // currentUserId={user?.id}
        currentUserRank={leaderboard.currentUserRank}
        currentUserCoins={coins.balance}
        currentUserStreak={streakDays}
        currentUserName={`${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()}
        currentUserGroup={activeCourse.courseName}
        currentUserAvatar={userAvatar}
        filter={leaderboard.filter}
        onFilterChange={handleLeaderboardFilter}
        isLoading={leaderboard.isLeaderboardLoading}
      />
    </div>
  );
};
