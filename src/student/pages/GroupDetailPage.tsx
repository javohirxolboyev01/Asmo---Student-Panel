// src/student/pages/GroupDetailPage.tsx
// Group details: group info chips and the full lesson list.
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  Clock,
  GraduationCap,
  PencilLine,
  Search,
  BookX,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useGroupDetailQuery } from "@/hooks/queries/useGroups";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import { isOverdue } from "@/utilist/calculateDeadline";
import { formatDate } from "@/utilist/formatData";
import type { LessonListItem } from "@/types/lesson";
import { EmptyState, ErrorState, PageHeader, Skel } from "../components/ui";
import { IconTile, InlineIcon } from "../components/icons";
import "../theme/groups.css";

const hwState = (l: LessonListItem) =>
  !l.homework
    ? "none"
    : l.homework.isOverdue || isOverdue(l.homework.deadline)
      ? "late"
      : "open";

const LessonRow = ({ lesson }: { lesson: LessonListItem }) => {
  const { t } = useTranslation();
  const state = hwState(lesson);
  const cls = state === "open" ? " sp-hw" : state === "late" ? " sp-late" : "";
  return (
    <Link
      to={`/lessons/${lesson.id}`}
      className={`sp-row sp-groups-lesson${cls}`}
    >
      <div className="sp-ic" aria-hidden="true">
        {state === "open" ? (
          <IconTile icon={PencilLine} tint="orange" />
        ) : (
          <IconTile tint={state === "late" ? "red" : "gray"} soft>
            {lesson.lessonOrder}
          </IconTile>
        )}
      </div>
      <div className="sp-t">
        <b>{lesson.topic}</b>
        <small>
          <InlineIcon icon={CalendarDays} /> {formatDate(lesson.lessonDate)}
          {lesson.homework?.deadline && (
            <>
              {" · "}
              <span className={state === "late" ? "sp-groups-late" : undefined}>
                <InlineIcon icon={Clock} />{" "}
                {t("space.groups.deadline", {
                  date: formatDate(lesson.homework.deadline),
                })}
              </span>
            </>
          )}
        </small>
      </div>
      <span
        className={
          state === "open"
            ? "sp-badge sp-sun"
            : state === "late"
              ? "sp-badge sp-pink"
              : "sp-badge sp-mute"
        }
      >
        {state === "open"
          ? t("space.groups.hwOpen")
          : state === "late"
            ? t("space.groups.hwOverdue")
            : t("space.groups.hwNone")}
      </span>
      <ChevronRight className="sp-chev" aria-hidden="true" />
    </Link>
  );
};

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
    <Skel className="mt-7 h-6 w-48" />
    <div className="sp-groups-lessons mt-3">
      {Array.from({ length: 4 }, (_, i) => (
        <Skel key={i} className="mb-2.5 h-[72px]" />
      ))}
    </div>
  </div>
);

export const GroupDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useGroupDetailQuery(id);
  const back = { to: "/groups", label: t("groups.title") };

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

  const lessons = data.lessons;
  const schedule = [group.schedule?.days?.join(", "), group.schedule?.time]
    .filter(Boolean)
    .join(" · ");
  const subtitle = [group.courseName, group.directionName]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="sp-page">
      <PageHeader
        back={back}
        title={group.name}
        subtitle={subtitle || undefined}
        right={
          <div className="sp-pill">
            <BookOpen aria-hidden="true" strokeWidth={2.2} /> <span>{lessons.length}</span>
          </div>
        }
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
          <InlineIcon icon={BookOpen} /> {t("space.groups.lessonsCount", { n: lessons.length })}
        </span>
      </div>

      <div className="sp-sec">
        <h2>{t("space.groups.allLessons")}</h2>
        <small>
          {lessons.length > 0 &&
            t("space.groups.lessonsCount", { n: lessons.length })}
        </small>
      </div>
      {lessons.length === 0 ? (
        <EmptyState
          icon={BookX}
          title={t("groupDetail.noLessons")}
          text={t("space.groups.noLessonsHint")}
        />
      ) : (
        <div className="sp-groups-lessons">
          {lessons.map((l) => (
            <LessonRow key={l.id} lesson={l} />
          ))}
        </div>
      )}
    </div>
  );
};
