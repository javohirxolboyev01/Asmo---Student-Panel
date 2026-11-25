// src/student/pages/DashboardPage.tsx
// Student home. Order = what a student needs first: greeting, course
// progress ring (completed ÷ all lessons), homework to do, the daily gift +
// tests, my results, group ranking. Mobile: one column in that order;
// desktop: progress + results left, homework + tests + ranking right.
// Tests pay their own coins (modules/quizzes); the daily gift is rolled by
// the backend (modules/missions).
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  Gem,
  PencilLine,
  Telescope,
  Trophy,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useDashboardQuery,
  useLeaderboardQuery,
} from "@/hooks/queries/useDashboard";
import { useAttendanceQuery } from "@/hooks/queries/useAttendance";
import { useMissionsTodayQuery } from "@/hooks/queries/useMissions";
import { useMyQuizzesQuery } from "@/hooks/queries/useQuizzes";
import { getErrorMessage } from "@/lib/toast";
import type { LeaderboardFilter } from "@/components/Dashboard/CoinLeaderboard";
import {
  getGroupCourseName,
  getGroupName,
  getLevelFromCourse,
  getNextLevel,
} from "../lib/level";
import { SpaceAvatar } from "../components/SpaceAvatar";
import { EmptyState, ErrorState } from "../components/ui";
import { Tests, TestsSkeleton } from "../components/Tests";
import { DailyChest } from "../components/DailyChest";
import { ProgressRing } from "../components/ProgressRing";
import { CoinGlyph, IconTile } from "../components/icons";
import { timeLeftLabel } from "../components/groups/lessonStatus";
import { getHoursUntilDeadline } from "@/utilist/calculateDeadline";

const CREW_SIZE = 5;
const RANK_BADGE: Record<number, CSSProperties> = {
  1: { background: "var(--sp-tint-yellow)", color: "#fff" },
  2: { background: "var(--sp-tint-gray)", color: "#fff" },
  3: { background: "var(--sp-tint-brown)", color: "#fff" },
};
const FILTER_LABEL: Record<LeaderboardFilter, string> = {
  week: "dashboardWidgets.filterWeek",
  month: "dashboardWidgets.filterMonth",
  all: "dashboardWidgets.filterAll",
};

const DashboardSkeleton = () => (
  <div className="sp-layout sp-home" aria-busy="true">
    <div className="sp-col">
      <div className="sp-home-hero">
        <div className="sp-skel mt-6 h-9 w-2/3" />
        <div className="sp-skel mt-2 h-4 w-3/4" />
      </div>
      <div className="sp-home-progress">
        <div className="sp-skel mt-7 h-6 w-48" />
        <div className="sp-skel sp-ring-card" />
      </div>
      <div className="sp-home-results">
        <div className="sp-skel mt-7 h-6 w-40" />
        <div className="sp-stats mt-3">
          <div className="sp-skel h-28" />
          <div className="sp-skel h-28" />
          <div className="sp-skel h-28" />
        </div>
      </div>
    </div>
    <div className="sp-col sp-col-side">
      <div className="sp-home-tests">
        <div className="sp-skel mt-7 h-[70px]" />
        <div className="sp-skel mt-6 h-6 w-32" />
        <div className="mt-3">
          <TestsSkeleton />
        </div>
      </div>
      <div className="sp-home-ranking">
        <div className="sp-skel mt-6 h-6 w-40" />
        <div className="sp-skel mt-3 h-64" />
      </div>
    </div>
  </div>
);

export const DashboardPage = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useDashboardQuery();
  const [filter, setFilter] = useState<LeaderboardFilter>("week");
  const { data: leaderboard, isLoading: crewLoading } =
    useLeaderboardQuery(filter);
  const { data: attendance } = useAttendanceQuery();
  // Only the daily gift (chest) is still used from the missions endpoint.
  const missions = useMissionsTodayQuery();
  const tests = useMyQuizzesQuery();

  if (isLoading) return <DashboardSkeleton />;

  // Cached data wins over a failed background refetch (offline, flaky network).
  if (!data) {
    return (
      <ErrorState
        message={error ? getErrorMessage(error, t("common.error")) : undefined}
        onRetry={() => refetch()}
      />
    );
  }

  const homework = data.pendingHomework ?? [];
  const group = data.groups?.[0];
  const level = group ? getLevelFromCourse(getGroupCourseName(group)) : null;
  const nextLevel = level ? getNextLevel(level) : null;
  const completedLessons = group?.completedLessons ?? 0;
  const totalLessons = group?.totalLessons ?? 0;
  // Course progress = completed lessons ÷ all lessons (server % as fallback).
  const fuel = Math.min(
    100,
    Math.max(0, totalLessons > 0 ? (completedLessons / totalLessons) * 100 : (group?.progress ?? 0)),
  );
  const week = Math.ceil(completedLessons / 2);

  const now = new Date();
  const coinsThisMonth = (data.recentTransactions ?? [])
    .filter((tx) => {
      if (tx.amount <= 0) return false;
      const date = new Date(tx.createdAt ?? tx.date ?? "");
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, tx) => sum + tx.amount, 0);

  const students = leaderboard?.students ?? [];
  const myIndex = user ? students.findIndex((s) => s.id === user.id) : -1;
  const myRank = myIndex >= 0 ? myIndex + 1 : leaderboard?.currentUserRank;
  const crew = students.slice(0, CREW_SIZE);
  const showMeBelow = myIndex >= CREW_SIZE;

  const renderMember = (index: number) => {
    const s = students[index];
    const rank = index + 1;
    const isMe = index === myIndex;
    const gap = isMe && index > 0 ? students[index - 1].coins - s.coins : 0;
    return (
      <div key={s.id} className={isMe ? "sp-mem sp-me" : "sp-mem"}>
        <span className="sp-a">
          <SpaceAvatar avatar={s.avatar} name={s.name} />
        </span>
        <span className="sp-n">
          <span>
            {isMe
              ? t("space.crewMe", { name: user?.firstName ?? s.name })
              : s.name}
          </span>
          <small>
            {isMe && rank > 1
              ? t("space.crewGap", { rank: rank - 1, gap: Math.max(1, gap) })
              : (
                <>
                  <CoinGlyph /> {s.coins}
                </>
              )}
          </small>
        </span>
        <span
          className="sp-k"
          style={
            RANK_BADGE[rank] ?? {
              background: "var(--sp-card)",
              color: "inherit",
            }
          }
        >
          {rank}
        </span>
      </div>
    );
  };

  return (
    <div className="sp-layout sp-home">
      <div className="sp-col">
        <section className="sp-home-hero">
          <h1 className="sp-title">
            {t("space.heroTitle", { name: user?.firstName ?? "" })}
          </h1>
          <p className="sp-sub">{t("home.subtitle")}</p>
        </section>

        <section className="sp-home-progress" aria-labelledby="sp-home-progress">
          <div className="sp-sec">
            <h2 id="sp-home-progress">{t("space.fuel")}</h2>
            {group && <small className="truncate">{getGroupName(group).trim()}</small>}
          </div>
          {group && level ? (
            <>
              <div className="sp-ring-card">
                <ProgressRing value={fuel} boost={null} label={t("space.fuel")} />
                <div className="sp-ring-info">
                  <div className="sp-ring-levels">
                    <span>{level}</span>
                    {nextLevel && (
                      <>
                        <ChevronRight aria-hidden="true" />
                        <b>{nextLevel}</b>
                      </>
                    )}
                  </div>
                  <small>{nextLevel ? t("space.targetPlanet") : t("space.heroSubTop")}</small>
                  <small className="sp-ring-note">
                    {totalLessons > 0
                      ? t("home.lessonsDone", { completed: completedLessons, total: totalLessons })
                      : nextLevel
                        ? t("space.heroSub", { planet: nextLevel })
                        : null}
                  </small>
                </div>
              </div>
              <div className="sp-chips">
                {totalLessons > 0 && completedLessons < totalLessons && (
                  <span>
                    <BookOpen aria-hidden="true" /> {t("home.nextLesson", { n: completedLessons + 1 })}
                  </span>
                )}
                {week > 0 && (
                  <span>
                    <CalendarDays aria-hidden="true" /> {t("dashboardWidgets.week", { week })}
                  </span>
                )}
                {/* The ring already shows the %; the chip only appears once the course is done. */}
                {fuel >= 100 && (
                  <span>
                    <CircleCheck aria-hidden="true" />{" "}
                    {t("dashboardWidgets.completed", { percentage: Math.round(fuel) })}
                  </span>
                )}
              </div>
              {nextLevel && totalLessons > 0 && (
                <p className="sp-home-hint">{t("space.heroSub", { planet: nextLevel })}</p>
              )}
            </>
          ) : (
            <EmptyState
              icon={Telescope}
              title={t("dashboard.noGroup")}
              text={t("space.groups.emptyActiveHint")}
              action={
                <Link to="/groups" className="sp-cta inline-flex no-underline">
                  {t("home.goGroups")}
                </Link>
              }
            />
          )}
        </section>

        <section className="sp-home-results" aria-labelledby="sp-home-results">
          <div className="sp-sec">
            <h2 id="sp-home-results">{t("space.myResults")}</h2>
          </div>
          <div className="sp-stats">
            <div className="sp-s">
              <IconTile icon={Trophy} tint="orange" soft />
              <b>{myRank ?? "-"}</b>
              <small>{t("home.statRank")}</small>
            </div>
            <Link to="/attendance" className="sp-s">
              <IconTile icon={CalendarCheck} tint="green" soft />
              <b>{attendance?.stats.present ?? 0}</b>
              <small>{t("home.statAttended")}</small>
            </Link>
            <Link to="/coins" className="sp-s">
              <IconTile icon={Gem} tint="teal" soft />
              <b>+{coinsThisMonth}</b>
              <small>{t("home.statCoinsMonth")}</small>
            </Link>
          </div>
        </section>
      </div>

      <div className="sp-col sp-col-side">
        {homework.length > 0 && (
          <section className="sp-home-hw" aria-labelledby="sp-home-hw">
            <div className="sp-sec">
              <h2 id="sp-home-hw">{t("home.homeworkTitle")}</h2>
              <small>{homework.length}</small>
            </div>
            {homework.map((hw) => {
              const urgent = getHoursUntilDeadline(hw.deadline) < 24;
              return (
                <Link key={hw.id} to={`/lessons/${hw.lessonId}#homework`} className="sp-row">
                  <span className="sp-ic" aria-hidden="true">
                    <IconTile icon={PencilLine} tint="orange" />
                  </span>
                  <span className="sp-t">
                    <b>{hw.title}</b>
                    <small className="truncate">
                      {hw.lessonTopic} · {hw.groupName}
                    </small>
                    <small className={urgent ? "sp-home-hw-due sp-urgent" : "sp-home-hw-due"}>
                      {timeLeftLabel(t, hw.deadline)}
                    </small>
                  </span>
                  <ChevronRight className="sp-chev" aria-hidden="true" />
                </Link>
              );
            })}
          </section>
        )}

        <section className="sp-home-tests" aria-labelledby="sp-home-tests">
          {missions.data && (
            <div className="sp-home-chest">
              <DailyChest
                opened={missions.data.chest.opened}
                reward={missions.data.chest.reward}
              />
            </div>
          )}
          <div className="sp-sec">
            <h2 id="sp-home-tests">{t("home.testsTitle")}</h2>
          </div>
          {tests.isLoading ? (
            <TestsSkeleton />
          ) : tests.data ? (
            <Tests quizzes={tests.data} />
          ) : (
            <ErrorState onRetry={() => tests.refetch()} />
          )}
        </section>

        <section className="sp-home-ranking" aria-labelledby="sp-home-ranking">
          <div className="sp-sec sp-sec-wrap">
            <div>
              <h2 id="sp-home-ranking">{t("space.crew")}</h2>
              <small>{t("home.rankingHint")}</small>
            </div>
            <div className="sp-tabs" role="tablist" aria-label={t("space.crew")}>
              {(Object.keys(FILTER_LABEL) as LeaderboardFilter[]).map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  className={filter === f ? "on" : undefined}
                  onClick={() => setFilter(f)}
                >
                  {t(FILTER_LABEL[f])}
                </button>
              ))}
            </div>
          </div>
          <div className="sp-crew">
            {crewLoading ? (
              Array.from({ length: CREW_SIZE }, (_, i) => (
                <div key={i} className="sp-skel mb-2.5 h-14" />
              ))
            ) : crew.length === 0 ? (
              <EmptyState panel={false} icon={Trophy} title={t("dashboardWidgets.noData")} />
            ) : (
              <>
                {crew.map((_, i) => renderMember(i))}
                {showMeBelow && renderMember(myIndex)}
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
