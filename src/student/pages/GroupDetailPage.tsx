// src/student/pages/GroupDetailPage.tsx
// Group details as a course timeline: info chips, "Bajarish kerak" (open
// homework not sent yet), then every lesson grouped into Bugun / Kelgusi /
// O'tgan, each row showing lesson number, topic, date & time and where its
// homework stands (not sent / checking / score / missed).
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Search,
  BookX,
  ChevronDown,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useGroupDetailQuery } from "@/hooks/queries/useGroups";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import type { LessonListItem } from "@/types/lesson";
import { EmptyState, ErrorState, PageHeader, Skel } from "../components/ui";
import { InlineIcon } from "../components/icons";
import {
  HwChip,
  hwStateOf,
  lessonWhen,
  whenLabel,
  type HwState,
} from "../components/groups/lessonStatus";
import "../theme/groups.css";

const PAST_PREVIEW = 6;

type Status = { state: HwState; score?: number | null };

const LessonRow = ({
  lesson,
  status,
  highlight,
}: {
  lesson: LessonListItem;
  status: Status;
  highlight?: "today" | "next";
}) => {
  const { t } = useTranslation();
  const when = lessonWhen(lesson.lessonDate);
  const hw = lesson.homework;
  return (
    <Link
      to={`/lessons/${lesson.id}`}
      className={[
        "sp-row sp-tl-row",
        highlight && "sp-tl-hi",
        when === "past" && "sp-tl-past",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="sp-tl-num" aria-hidden="true">
        <b>{lesson.lessonOrder}</b>
        <small>{t("space.groups.lessonShort")}</small>
      </div>
      <div className="sp-t">
        {highlight && (
          <span className="sp-tl-flag">
            {highlight === "today"
              ? t("space.groups.todayLesson")
              : t("space.groups.nextLesson")}
          </span>
        )}
        <b className="sp-tl-topic">
          <span className="sr-only">
            {t("lessonDetail.lessonNumber", { order: lesson.lessonOrder })}
            :{" "}
          </span>
          {lesson.topic}
        </b>
        <small className="sp-tl-when">
          <InlineIcon icon={CalendarDays} /> {whenLabel(t, lesson.lessonDate)}
        </small>
        <div className="sp-tl-tags">
          <HwChip
            t={t}
            state={status.state}
            deadline={hw?.deadline}
            score={status.score}
            max={hw?.maxScore}
            long
          />
        </div>
      </div>
      <ChevronRight className="sp-chev" aria-hidden="true" />
    </Link>
  );
};

const Section = ({
  id,
  title,
  hint,
  count,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  count?: number;
  children: ReactNode;
}) => (
  <section aria-labelledby={id} className="sp-tl-sec">
    <div className="sp-sec sp-sec-wrap">
      <div>
        <h2 id={id}>{title}</h2>
        {hint && <small>{hint}</small>}
      </div>
      {count !== undefined && <small>{count}</small>}
    </div>
    <div className="sp-tl-list">{children}</div>
  </section>
);

const DetailSkeleton = () => (
  <div aria-busy="true">
    <Skel className="mt-4 h-9 w-28" />
    <Skel className="mt-5 h-9 w-2/3" />
    <Skel className="mt-2 h-4 w-1/2" />
    <div className="mt-4 flex flex-wrap gap-2">
      <Skel className="h-8 w-36" />
      <Skel className="h-8 w-44" />
      <Skel className="h-8 w-24" />
    </div>
    <Skel className="mt-7 h-6 w-40" />
    <div className="mt-3">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="sp-row sp-tl-row" style={{ cursor: "default" }}>
          <Skel className="h-[52px] w-[46px] !rounded-[15px]" />
          <div className="flex-1">
            <Skel className="h-5 w-3/4" />
            <Skel className="mt-2 h-4 w-1/2" />
            <Skel className="mt-2 h-6 w-28" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const GroupDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGroupDetailQuery(id);
  const [showAllPast, setShowAllPast] = useState(false);
  const back = { to: "/groups", label: t("groups.title") };

  const lessons = data?.lessons ?? [];

  if (isLoading) {
    return (
      <div className="sp-page">
        <DetailSkeleton />
      </div>
    );
  }

  // Cached data wins over a failed background refetch (offline, flaky network).
  if (error && !data) {
    return (
      <div className="sp-page">
        <PageHeader back={back} title={t("groupDetail.notFound")} />
        <ErrorState
          message={getErrorMessage(error, t("groupDetail.notFound"))}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const group = data?.group;
  if (!group) {
    return (
      <div className="sp-page">
        <PageHeader back={back} title={t("groupDetail.notFound")} />
        <EmptyState
          icon={Search}
          title={t("groupDetail.notFound")}
          action={
            <Link to="/groups" className="sp-cta inline-block no-underline">
              {t("groupDetail.backToGroups")}
            </Link>
          }
        />
      </div>
    );
  }

  // The group detail carries this student's own homework state (no extra requests).
  const statusOf = (l: LessonListItem): Status => {
    const hw = l.homework;
    const st = hw?.status;
    const submission = st === "graded" || st === "submitted" ? { status: st } : null;
    return { state: hwStateOf(hw, submission, true), score: hw?.score };
  };

  const byDate = (a: LessonListItem, b: LessonListItem) =>
    new Date(a.lessonDate).getTime() - new Date(b.lessonDate).getTime();
  const today = lessons
    .filter((l) => lessonWhen(l.lessonDate) === "today")
    .sort(byDate);
  const upcoming = lessons
    .filter((l) => lessonWhen(l.lessonDate) === "upcoming")
    .sort(byDate);
  const past = lessons
    .filter((l) => lessonWhen(l.lessonDate) === "past")
    .sort((a, b) => byDate(b, a));
  const nextId = today.length === 0 ? upcoming[0]?.id : undefined;
  const pastShown = showAllPast ? past : past.slice(0, PAST_PREVIEW);

  // Homework still waiting for an answer goes first, so the next step is obvious.
  const todo = lessons
    .filter((l) => {
      const s = statusOf(l).state;
      return (
        s === "todo" ||
        (s === "pending" &&
          l.homework &&
          new Date(l.homework.deadline) > new Date())
      );
    })
    .sort(
      (a, b) =>
        new Date(a.homework!.deadline).getTime() -
        new Date(b.homework!.deadline).getTime(),
    );

  const schedule = [group.schedule?.days?.join(", "), group.schedule?.time]
    .filter(Boolean)
    .join(" · ");
  const subtitle = [group.courseName, group.directionName]
    .filter(Boolean)
    .join(" · ");
  const row = (l: LessonListItem, highlight?: "today" | "next") => (
    <LessonRow
      key={l.id}
      lesson={l}
      status={statusOf(l)}
      highlight={highlight}
    />
  );

  return (
    <div className="sp-page">
      <PageHeader
        back={back}
        title={group.name}
        subtitle={subtitle || undefined}
      />

      <div className="sp-groups-info">
        {group.teacherName && (
          <span className="sp-groups-teacher-chip">
            <GraduationCap
              className="sp-groups-teacher-icon"
              aria-hidden="true"
            />
            <span className="sp-groups-teacher-name">{group.teacherName}</span>
          </span>
        )}
        {schedule && (
          <span>
            <InlineIcon icon={CalendarDays} /> {schedule}
          </span>
        )}
        <span>
          <InlineIcon icon={BookOpen} />{" "}
          {lessons.length > 0
            ? t("space.groups.lessonsProgress", {
                n: lessons.length,
                done: past.length,
              })
            : t("space.groups.lessonsCount", { n: 0 })}
        </span>
      </div>

      {lessons.length === 0 ? (
        <EmptyState
          icon={BookX}
          title={t("groupDetail.noLessons")}
          text={t("space.groups.noLessonsHint")}
          className="mt-6"
        />
      ) : (
        <div className="sp-tl">
          {todo.length > 0 && (
            <div className="sp-tl-aside">
              <Section
                id="sp-tl-todo"
                title={t("space.groups.todoTitle")}
                hint={t("space.groups.openHomeworkHint")}
                count={todo.length}
              >
                {todo.map((l) => row(l))}
              </Section>
            </div>
          )}

          <div className="sp-tl-main">
            {today.length > 0 && (
              <Section id="sp-tl-today" title={t("space.groups.secToday")}>
                {today.map((l) => row(l, "today"))}
              </Section>
            )}
            {upcoming.length > 0 && (
              <Section
                id="sp-tl-next"
                title={t("space.groups.secUpcoming")}
                count={upcoming.length}
              >
                {upcoming.map((l) =>
                  row(l, l.id === nextId ? "next" : undefined),
                )}
              </Section>
            )}
            {past.length > 0 && (
              <Section
                id="sp-tl-past"
                title={t("space.groups.secPast")}
                count={past.length}
              >
                {pastShown.map((l) => row(l))}
                {past.length > PAST_PREVIEW && (
                  <button
                    type="button"
                    className="sp-cta sp-ghost sp-tl-more"
                    aria-expanded={showAllPast}
                    onClick={() => setShowAllPast((v) => !v)}
                  >
                    <ChevronDown
                      aria-hidden="true"
                      className={showAllPast ? "rotate-180" : undefined}
                    />
                    {showAllPast
                      ? t("space.groups.showLess")
                      : t("space.groups.showMorePast", {
                          n: past.length - PAST_PREVIEW,
                        })}
                  </button>
                )}
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
