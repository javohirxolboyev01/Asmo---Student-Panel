// src/teacher/pages/AttendancePage.tsx
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { Calendar, ChevronRight, Users } from "lucide-react";

import { SkeletonHeader, SkeletonStatGrid, SkeletonTable } from "@/components/common/Skeleton";
import { useTranslation } from "@/hooks/useTranslation";

export const AttendancePage = () => {
  const { t } = useTranslation();
  const { data: groups = [], isLoading: groupsLoading } = useGroupsQuery();
  const { data: students = [], isLoading: studentsLoading } = useStudentsQuery();

  const stats = useMemo(() => {
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
    return Object.fromEntries(entries) as Record<string, { percentage: number; studentCount: number }>;
  }, [students]);

  if (studentsLoading || groupsLoading) {
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
