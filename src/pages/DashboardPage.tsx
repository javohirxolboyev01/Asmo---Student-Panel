// src/pages/DashboardPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  Bell,
  Coins as CoinsIcon,
} from "lucide-react";

import { formatDate, formatTime } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuthStore } from "@/stores/authStore";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data, isLoading, error, fetchDashboard } = useDashboardStore();
  const { setNotifications } = useNotificationStore();

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

  const { activeCourse, attendance, coins, upcomingLessons, notifications } =
    data;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1D26]">
            Salom, {user?.firstName}
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Bugun o'quv kuningizni boshlang
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-xs font-medium text-gray-500">Kun</span>
          <span className="text-sm font-semibold">7/20</span>
        </div>
      </div>

      {/* Course Card - Stitch Design */}
      <div className="card overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#2D6BFF]/10 text-[#2D6BFF] rounded-full">
                  {activeCourse.groupName}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-full">
                  {activeCourse.directionName}
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-[#1A1D26]">
                {activeCourse.courseName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeCourse.teacherName}
              </p>
            </div>
            <div className="w-12 h-12 bg-[#2D6BFF]/10 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#2D6BFF]" />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold text-[#1A1D26]">
                {activeCourse.progress}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2D6BFF] rounded-full transition-all duration-500"
                style={{ width: `${activeCourse.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>
                {activeCourse.completedLessons}/{activeCourse.totalLessons} dars
              </span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Keyingi: {formatDate(activeCourse.nextLessonDate)},{" "}
                  {formatTime(activeCourse.nextLessonDate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - 3 columns with click navigation */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {/* Attendance Card - Navigate to /attendance */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/attendance")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#E8F5E9] rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[#2E7D32]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1A1D26]">
            {attendance.thisWeek.percentage}%
          </p>
          <p className="text-xs text-gray-500">Davomat</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {attendance.thisWeek.present}/{attendance.thisWeek.total}
          </p>
        </div>

        {/* Coins Card - Navigate to /coins */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/coins")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#FFF8E1] rounded-full flex items-center justify-center">
              <CoinsIcon className="w-5 h-5 text-[#F59E0B]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#F59E0B]">{coins.balance}</p>
          <p className="text-xs text-gray-500">Coin</p>
          <p className="text-xs text-green-600 mt-0.5">
            +{coins.thisMonth} bu oy
          </p>
        </div>

        {/* Lessons Card - Navigate to /groups */}
        <div
          className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95"
          onClick={() => navigate("/groups")}
        >
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 bg-[#E3F2FD] rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#0D47A1]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1A1D26]">
            {upcomingLessons.length}
          </p>
          <p className="text-xs text-gray-500">Darslar</p>
          <p className="text-xs text-gray-400 mt-0.5">Bugun</p>
        </div>
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
