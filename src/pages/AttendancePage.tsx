// src/pages/AttendancePage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { attendanceService } from "@/services/attendanceService";
import { studentService } from "@/services/studentService";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { Calendar, CalendarX, ChevronRight, ChevronLeft, Users, ClipboardList } from "lucide-react";

import { formatDate } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { Skeleton, SkeletonHeader, SkeletonStatGrid, SkeletonTable } from "@/components/common/Skeleton";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";

type ViewMode = "weekly" | "monthly";

interface AttendanceRecord {
  id: string;
  lessonId: string;
  lessonTopic: string;
  lessonDate: string;
  status: "present" | "absent" | "late" | "excused";
  markedAt: string;
}

interface AttendanceData {
  stats: {
    total: number;
    present: number;
    percentage: number;
  };
  records: AttendanceRecord[];
}

const TeacherAttendanceOverview = () => {
  const { t } = useTranslation();
  const { groups, isLoading: groupsLoading, fetchGroups } = useGroupStore();
  const [stats, setStats] = useState<Record<string, { percentage: number; studentCount: number }>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (groupsLoading) return;
    setIsLoading(true);
    studentService
      .getStudents()
      .then((students) => {
        const byGroup: Record<string, number[]> = {};
        students.forEach((student) => {
          student.groups.forEach((g) => {
            (byGroup[g.id] ??= []).push(student.attendancePercentage);
          });
        });
        const entries = Object.entries(byGroup).map(([groupId, percentages]) => [
          groupId,
          {
            percentage: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
            studentCount: percentages.length,
          },
        ] as const);
        setStats(Object.fromEntries(entries));
      })
      .finally(() => setIsLoading(false));
  }, [groupsLoading]);

  if (isLoading || groupsLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <SkeletonStatGrid count={3} />
        <SkeletonTable rows={5} cols={3} />
      </div>
    );
  }

  const percentages = Object.values(stats).map((s) => s.percentage);
  const avgPercentage = percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;
  const totalStudents = Object.values(stats).reduce((sum, s) => sum + s.studentCount, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
          {t("attendance.overviewTitle")}
        </h1>
        <p className="text-gray-500 text-sm md:text-base">{t("attendance.overviewSubtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{groups.length}</p>
          <p className="text-xs text-gray-500">{t("dashboard.statGroups")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalStudents}</p>
          <p className="text-xs text-gray-500">{t("attendance.studentsCount")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#2E7D32]">{avgPercentage}%</p>
          <p className="text-xs text-gray-500">{t("attendance.avgPercentage")}</p>
        </div>
      </div>

      <div className="card">
        <div className="p-5">
          {groups.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t("attendance.noGroups")}</p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  to={`/groups/${group.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {group.studentCount ?? 0}
                    </span>
                    <span className="text-sm font-semibold text-[#2E7D32]">{stats[group.id]?.percentage ?? 0}%</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StudentAttendanceView = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [noLessonDay, setNoLessonDay] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await attendanceService.getAttendance();
        setData(result);
      } catch (err) {
        setError(t("common.loadError"));
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    (data?.records ?? []).forEach((r) => {
      const d = new Date(r.lessonDate);
      map.set(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`, r);
    });
    return map;
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <Skeleton className="w-full h-11 rounded-2xl" />
        <SkeletonStatGrid count={4} />
        <div className="card p-5">
          <Skeleton className="w-32 h-5 mb-4" />
          <Skeleton className="w-full h-52" />
        </div>
        <div className="card p-5">
          <Skeleton className="w-40 h-5 mb-4" />
          <SkeletonTable rows={5} cols={3} />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error || t("common.notFound")}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  const { records } = data;
  const totalLessons = data.stats.total;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const percentage =
    data.stats.percentage || (totalLessons ? Math.round((present / totalLessons) * 100) : 0);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-first offset
  const today = new Date();
  const monthNames = t("dashboardWidgets.months").split(",");
  const monthLabel = `${monthNames[month]} ${year}`;

  const goToMonth = (offset: number) => setCurrentMonth(new Date(year, month + offset, 1));

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
            {t("attendance.title")}
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            {t("attendance.subtitle")}
          </p>
        </div>
        <div className="bg-white dark:bg-card-dark px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-sm font-semibold text-[#2E7D32]">
            {percentage}%
          </span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-white dark:bg-card-dark rounded-2xl p-1 border border-gray-100 dark:border-gray-800">
        {(["weekly", "monthly"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-all sm:px-4 sm:py-2.5 sm:text-sm sm:rounded-xl",
              viewMode === mode
                ? "bg-warning text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 dark:text-gray-100",
            )}
          >
            {mode === "weekly" ? t("attendance.weekly") : t("attendance.monthly")}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {totalLessons}
          </p>
          <p className="text-xs text-gray-500">{t("attendance.totalLessons")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#2E7D32]">{present}</p>
          <p className="text-xs text-gray-500">{t("attendance.present")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#C62828]">{absent}</p>
          <p className="text-xs text-gray-500">{t("attendance.absent")}</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#E65100]">{late}</p>
          <p className="text-xs text-gray-500">{t("attendance.late")}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-500" />
              {t("attendance.calendar")}
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToMonth(-1)}
                aria-label={t("common.back")}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 capitalize min-w-[110px] text-center">
                {monthLabel}
              </span>
              <button
                type="button"
                onClick={() => goToMonth(1)}
                aria-label={t("common.retry")}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 dark:text-gray-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-w-sm md:mx-auto">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {t("attendance.weekDays").split(",").map((day, i) => (
                <div key={i} className="text-xs font-medium text-gray-400 py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <div key={`blank-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const record = recordsByDate.get(`${year}-${month}-${day}`);
                const status = record?.status;
                const isToday =
                  today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                const colorMap: Record<string, string> = {
                  present: "bg-[#4CAF50] text-white",
                  absent: "bg-[#F44336] text-white",
                  late: "bg-[#FF9800] text-white",
                  excused: "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300",
                };
                const cellClass = cn(
                  "w-full aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-transform hover:scale-105 active:scale-95 cursor-pointer",
                  status ? colorMap[status] : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10",
                  isToday && "ring-2 ring-offset-2 ring-warning dark:ring-offset-card-dark",
                );

                return (
                  <div key={day} className="aspect-square flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        record ? navigate(`/lessons/${record.lessonId}`) : setNoLessonDay(day)
                      }
                      className={cellClass}
                      title={record?.lessonTopic}
                    >
                      {day}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#4CAF50]" />
              <span className="text-xs text-gray-500">{t("attendance.legendPresent")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F44336]" />
              <span className="text-xs text-gray-500">{t("attendance.legendAbsent")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF9800]" />
              <span className="text-xs text-gray-500">{t("attendance.legendLate")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-500">{t("attendance.legendPlanned")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary-500" />
            {t("attendance.allRecords")}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 px-3">
                    {t("attendance.date")}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 px-3">
                    {t("attendance.topic")}
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 px-3">
                    {t("attendance.status")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record: AttendanceRecord) => (
                  <tr key={record.id} className="border-b border-gray-50 dark:border-gray-800">
                    <td className="py-2.5 px-3 text-sm text-gray-500">
                      {formatDate(record.lessonDate)}
                    </td>
                    <td className="py-2.5 px-3 text-sm text-gray-800 dark:text-gray-100">
                      {record.lessonTopic}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        isOpen={noLessonDay !== null}
        onClose={() => setNoLessonDay(null)}
        title={t("attendance.noLessonTitle")}
        maxWidth="max-w-sm"
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <CalendarX className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            {noLessonDay !== null && formatDate(new Date(year, month, noLessonDay))}
          </p>
          <p className="text-gray-800 dark:text-gray-100 font-medium mb-5">
            {t("attendance.noLessonThisDay")}
          </p>
          <Button onClick={() => setNoLessonDay(null)} fullWidth>
            {t("attendance.backToAttendance")}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export const AttendancePage = () => {
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  return isTeacher ? <TeacherAttendanceOverview /> : <StudentAttendanceView />;
};
