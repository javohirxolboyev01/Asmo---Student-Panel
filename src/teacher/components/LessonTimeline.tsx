// src/teacher/components/LessonTimeline.tsx
// Lessons of a group as a course timeline (teacher group page): grouped into
// Bugun / Kelgusi / O'tgan; each row shows the date box, lesson number,
// topic, time and the homework state (X/Y submitted, Z to grade, deadline).
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight, Clock, PencilLine } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import type { LessonListItem } from "@/types/lesson";
import { formatTime } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { DateBox, EmptyBox, Tag } from "./ui";
import "../theme/lesson.css";

const DAY = 86_400_000;
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
/** Calendar days from today: 0 = today, 1 = tomorrow, -1 = yesterday. */
export const dayOffset = (iso: string) =>
  Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / DAY);

const ddmm = (date: string) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime())
    ? ""
    : `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const PAST_PREVIEW = 8;

const Row = ({
  lesson,
  studentCount,
  flag,
}: {
  lesson: LessonListItem;
  studentCount: number;
  flag?: "today" | "next";
}) => {
  const { t } = useTranslation();
  const hw = lesson.homework;
  const submitted = hw?.submittedCount ?? 0;
  const graded = hw?.gradedCount ?? 0;
  const toGrade = Math.max(0, submitted - graded);
  const past = dayOffset(lesson.lessonDate) < 0;
  const dueOver = hw ? new Date(hw.deadline) < new Date() : false;
  return (
    <Link
      to={`/lessons/${lesson.id}`}
      className={cn("u-les u-tl", flag && "hi", past && "past")}
    >
      <DateBox date={lesson.lessonDate} />
      <div className="min-w-0 flex-1">
        {flag && (
          <span className="u-tl-flag">
            {flag === "today" ? t("us.tl.today") : t("us.tl.next")}
          </span>
        )}
        <span className="u-tl-meta">
          {t("us.tl.lessonN", { n: lesson.lessonOrder })} ·{" "}
          <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />{" "}
          {formatTime(lesson.lessonDate)}
        </span>
        <b className="u-tl-topic">{lesson.topic}</b>
        <div className="u-chips mt-2 !gap-1.5">
          {!hw ? (
            <Tag tone="mu">{t("us.groups.noHw")}</Tag>
          ) : (
            <>
              <Tag
                tone={
                  toGrade > 0
                    ? "gd"
                    : submitted >= studentCount && submitted > 0 && graded >= submitted
                      ? "ok"
                      : "pr"
                }
              >
                <PencilLine
                  className="u-i s"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {t("us.tl.submitted", { n: submitted, total: studentCount })}
              </Tag>
              {toGrade > 0 && (
                <Tag tone="er">{t("us.tl.toGrade", { n: toGrade })}</Tag>
              )}
              <Tag tone="mu">
                {dueOver
                  ? t("us.tl.dueOver", { d: ddmm(hw.deadline) })
                  : t("us.groups.due", { d: ddmm(hw.deadline) })}
              </Tag>
            </>
          )}
        </div>
      </div>
      <ChevronRight
        className="u-i m flex-none text-u-mu"
        strokeWidth={2}
        aria-hidden="true"
      />
    </Link>
  );
};

const Group = ({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: ReactNode;
}) => (
  <section className="u-tl-sec">
    <h3 className="u-day flex items-center justify-between">
      <span>{title}</span>
      {count !== undefined && <span>{count}</span>}
    </h3>
    <div className="u-stack">{children}</div>
  </section>
);

export const LessonTimeline = ({
  lessons,
  studentCount,
  action,
}: {
  lessons: LessonListItem[];
  /** Group size, the denominator of "X/Y topshirdi". */
  studentCount: number;
  /** Shown in the empty state (e.g. "Dars qo'shish"). */
  action?: ReactNode;
}) => {
  const { t } = useTranslation();
  const [allPast, setAllPast] = useState(false);

  if (lessons.length === 0) {
    return (
      <EmptyBox
        title={t("us.groups.noLessons")}
        text={t("us.groups.noLessonsSub")}
        action={action}
      />
    );
  }

  const time = (l: LessonListItem) => new Date(l.lessonDate).getTime();
  const today = lessons
    .filter((l) => dayOffset(l.lessonDate) === 0)
    .sort((a, b) => time(a) - time(b));
  const upcoming = lessons
    .filter((l) => dayOffset(l.lessonDate) > 0)
    .sort((a, b) => time(a) - time(b));
  const past = lessons
    .filter((l) => dayOffset(l.lessonDate) < 0)
    .sort((a, b) => time(b) - time(a));
  const nextId = today.length === 0 ? upcoming[0]?.id : undefined;
  const shownPast = allPast ? past : past.slice(0, PAST_PREVIEW);

  return (
    <div className="u-tl-wrap">
      {today.length > 0 && (
        <Group title={t("us.tl.secToday")}>
          {today.map((l) => (
            <Row
              key={l.id}
              lesson={l}
              studentCount={studentCount}
              flag="today"
            />
          ))}
        </Group>
      )}
      {upcoming.length > 0 && (
        <Group title={t("us.tl.secUpcoming")} count={upcoming.length}>
          {upcoming.map((l) => (
            <Row
              key={l.id}
              lesson={l}
              studentCount={studentCount}
              flag={l.id === nextId ? "next" : undefined}
            />
          ))}
        </Group>
      )}
      {past.length > 0 && (
        <Group title={t("us.tl.secPast")} count={past.length}>
          {shownPast.map((l) => (
            <Row key={l.id} lesson={l} studentCount={studentCount} />
          ))}
          {past.length > PAST_PREVIEW && (
            <button
              type="button"
              className="u-btn soft block"
              aria-expanded={allPast}
              onClick={() => setAllPast((v) => !v)}
            >
              <ChevronDown
                className={cn("u-i m", allPast && "rotate-180")}
                strokeWidth={2}
                aria-hidden="true"
              />
              {allPast
                ? t("us.tl.showLess")
                : t("us.tl.showMore", { n: past.length - PAST_PREVIEW })}
            </button>
          )}
        </Group>
      )}
    </div>
  );
};
