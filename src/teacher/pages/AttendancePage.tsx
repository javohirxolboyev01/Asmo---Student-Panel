// src/teacher/pages/AttendancePage.tsx
// Mock `attend` view: every student's attendance ring, plus the per-group
// overview (average per group, totals) above it.
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Calendar, Users } from "lucide-react";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import { isImageUrl } from "@/lib/utils";
import { Button } from "@/components/ui";
import { Avatar, EmptyBox, PageHeader, Ring, SectionHead, Skel, groupColor } from "../components/ui";

export const AttendancePage = () => {
  const { t } = useTranslation();
  const groupsQuery = useGroupsQuery();
  const studentsQuery = useStudentsQuery();
  const groups = groupsQuery.data ?? [];
  const students = studentsQuery.data ?? [];

  const stats = useMemo(() => {
    const byGroup: Record<string, number[]> = {};
    students.forEach((student) => {
      student.groups.forEach((g) => {
        (byGroup[g.id] ??= []).push(student.attendancePercentage);
      });
    });
    const entries = Object.entries(byGroup).map(
      ([groupId, percentages]) =>
        [
          groupId,
          {
            percentage: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
            studentCount: percentages.length,
          },
        ] as const,
    );
    return Object.fromEntries(entries) as Record<string, { percentage: number; studentCount: number }>;
  }, [students]);

  const header = (
    <PageHeader title={t("us.att.title")} subtitle={t("us.att.subtitle")} back={{ to: "/more" }} />
  );

  if (studentsQuery.isLoading || groupsQuery.isLoading) {
    return (
      <div aria-busy="true">
        {header}
        <Skel className="h-24" />
        <div className="u-cols u-stack u-sec">
          {Array.from({ length: 6 }, (_, i) => (
            <Skel key={i} className="h-[84px]" />
          ))}
        </div>
      </div>
    );
  }

  const error = studentsQuery.error ?? groupsQuery.error;
  if (error) {
    return (
      <>
        {header}
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={getErrorMessage(error, t("common.error"))}
          action={
            <Button
              onClick={() => {
                studentsQuery.refetch();
                groupsQuery.refetch();
              }}
            >
              {t("common.retry")}
            </Button>
          }
        />
      </>
    );
  }

  const percentages = Object.values(stats).map((s) => s.percentage);
  const avgPercentage =
    percentages.length > 0 ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;
  const totalStudents = Object.values(stats).reduce((sum, s) => sum + s.studentCount, 0);

  return (
    <div>
      {header}

      <div className="u-card">
        <div className="u-stats3">
          <div>
            <b>{groups.length}</b>
            <span>{t("dashboard.statGroups")}</span>
          </div>
          <div>
            <b>{totalStudents}</b>
            <span>{t("attendance.studentsCount")}</span>
          </div>
          <div>
            <b>{avgPercentage}%</b>
            <span>{t("attendance.avgPercentage")}</span>
          </div>
        </div>
      </div>

      {/* Per group */}
      <section className="u-sec">
        <SectionHead title={t("us.att.groups")} />
        {groups.length === 0 ? (
          <EmptyBox icon={Calendar} tone="mu" title={t("attendance.noGroups")} />
        ) : (
          <div className="u-cols u-stack">
            {groups.map((group) => {
              const stat = stats[group.id];
              const color = groupColor(group.id, group.direction?.color);
              return (
                <Link key={group.id} to={`/groups/${group.id}`} className="u-les">
                  <span className="u-mi" style={{ background: color, color: "#fff" }} aria-hidden="true">
                    <Users className="u-i" strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block truncate text-[17px]">{group.name}</b>
                    <small className="u-sub block">
                      {t("us.att.studentsN", { n: group.studentCount ?? stat?.studentCount ?? 0 })}
                    </small>
                  </div>
                  <Ring percent={stat ? stat.percentage : null} />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Per student (mock `attend`) */}
      <section className="u-sec">
        <SectionHead title={t("us.att.students")} />
        {students.length === 0 ? (
          <EmptyBox icon={Users} tone="mu" title={t("groupDetail.noStudents")} />
        ) : (
          <div className="u-cols u-stack">
            {students.map((s) => {
              const name = `${s.firstName} ${s.lastName}`;
              const hasGroup = s.groups.length > 0;
              return (
                <Link key={s.id} to={`/students/${s.id}`} className="u-les">
                  <Avatar name={name} src={isImageUrl(s.avatar) ? s.avatar : null} seed={s.id} />
                  <div className="min-w-0 flex-1">
                    <b className="block truncate">{name}</b>
                    <small className="u-sub block truncate">
                      {hasGroup ? s.groups.map((g) => g.name).join(", ") : t("us.att.noGroup")}
                    </small>
                  </div>
                  <Ring percent={hasGroup ? s.attendancePercentage : null} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
