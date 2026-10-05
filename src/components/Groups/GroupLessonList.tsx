// src/components/Groups/GroupLessonList.tsx
// Lessons of a group (teacher group page), 1:1 with the mock `.les` rows:
// date box, topic, homework tags and "sub/total topshirdi".
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import type { LessonListItem } from "@/types/lesson";
import { DateBox, EmptyBox, Tag } from "@/teacher/components/ui";

const ddmm = (date: string) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? ""
    : `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export const GroupLessonList = ({
  lessons,
  studentCount,
  action,
}: {
  lessons: LessonListItem[];
  /** Group size, the denominator of "sub/total topshirdi". */
  studentCount: number;
  /** Shown in the empty state (e.g. "Dars qo'shish"). */
  action?: ReactNode;
}) => {
  const { t } = useTranslation();

  if (lessons.length === 0) {
    return <EmptyBox title={t("us.groups.noLessons")} text={t("us.groups.noLessonsSub")} action={action} />;
  }

  // Newest first, like the mock.
  const sorted = [...lessons].sort((a, b) => new Date(b.lessonDate).getTime() - new Date(a.lessonDate).getTime());

  return (
    <div className="u-stack">
      {sorted.map((lesson) => {
        const hw = lesson.homework;
        return (
          <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="u-les">
            <DateBox date={lesson.lessonDate} />
            <div className="min-w-0 flex-1">
              <b className="block break-words text-[17px]">{lesson.topic}</b>
              <div className="u-chips mt-1.5">
                <Tag tone={hw ? "pr" : "mu"}>{hw ? t("us.groups.hwGiven") : t("us.groups.noHw")}</Tag>
                {hw?.deadline && (
                  <Tag tone="er">{t("us.groups.due", { d: ddmm(hw.deadline) })}</Tag>
                )}
              </div>
            </div>
            {hw && (
              <span className="flex-none text-right text-[13px] text-u-mu">
                {hw.submittedCount ?? 0}/{studentCount}
                <br />
                {t("us.groups.submitted")}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
};
