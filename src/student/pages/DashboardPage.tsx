// src/student/pages/DashboardPage.tsx
// "Kosmik maktab" home: the rocket flies from the current level to the next
// one as the group's course progress (fuel) grows, and gets a turbo kick for
// every claimed mission (components/Rocket); daily missions and the
// daily chest are verified/rolled by the backend (modules/missions).
import { useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import {
  useDashboardQuery,
  useLeaderboardQuery,
} from "@/hooks/queries/useDashboard";
import { useAttendanceQuery } from "@/hooks/queries/useAttendance";
import { useMissionsTodayQuery } from "@/hooks/queries/useMissions";
import { getErrorMessage } from "@/lib/toast";
import type { LeaderboardFilter } from "@/components/Dashboard/CoinLeaderboard";
import {
  getGroupCourseName,
  getLevelFromCourse,
  getNextLevel,
} from "../lib/level";
import { SpaceAvatar } from "../components/SpaceAvatar";
import { ErrorState } from "../components/ui";
import { Missions, MissionsSkeleton } from "../components/Missions";
import { DailyChest } from "../components/DailyChest";
import { Rocket, type RocketBoost } from "../components/Rocket";

const CREW_SIZE = 5;
const RANK_BADGE: Record<number, CSSProperties> = {
  1: { background: "var(--sp-sun)", color: "#3A2A00" },
  2: { background: "var(--sp-cyan)", color: "#06303a" },
  3: { background: "var(--sp-pink)", color: "#fff" },
};
const FILTER_LABEL: Record<LeaderboardFilter, string> = {
  week: "dashboardWidgets.filterWeek",
  month: "dashboardWidgets.filterMonth",
  all: "dashboardWidgets.filterAll",
};

const DashboardSkeleton = () => (
  <div className="sp-layout" aria-busy="true">
    <div className="sp-col">
      <div className="sp-skel mt-6 h-16" />
      <div className="sp-skel sp-orbit" />
      <div className="sp-stats mt-6">
        <div className="sp-skel h-24" />
        <div className="sp-skel h-24" />
        <div className="sp-skel h-24" />
      </div>
    </div>
    <div className="sp-col sp-col-side">
      <div className="sp-skel mt-6 h-20" />
      <div className="sp-skel mt-3 h-20" />
      <div className="sp-skel mt-6 h-48" />
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
  const missions = useMissionsTodayQuery();
  const [boost, setBoost] = useState<RocketBoost | null>(null);

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

  const group = data.groups?.[0];
  const level = group ? getLevelFromCourse(getGroupCourseName(group)) : null;
  const nextLevel = level ? getNextLevel(level) : null;
  const fuel = Math.min(100, Math.max(0, group?.progress ?? 0));
  const completedLessons = group?.completedLessons ?? 0;
  const totalLessons = group?.totalLessons ?? 0;
  const unit = `Unit ${completedLessons + 1}.${totalLessons}`;
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
              : `💎 ${s.coins}`}
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
    <div className="sp-layout">
      <div className="sp-col">
        <h1 className="sp-title">
          {t("space.heroTitle", { name: "" }).replace("?", "")}
          <span style={{ color: "#b6f23c" }}>{user?.firstName ?? ""}?</span>
        </h1>
        <p className="sp-sub">
          {!group
            ? t("dashboard.noGroup")
            : nextLevel
              ? t("space.heroSub", { planet: nextLevel })
              : t("space.heroSubTop")}
        </p>

        {group && level ? (
          <>
            <div className="sp-orbit">
              <div className="sp-planet" />
              <div className="sp-pl">
                <b>{nextLevel ?? level}</b>
                {t("space.targetPlanet")}
              </div>
              <div className="sp-home">{level}</div>
              <svg
                className="sp-trail"
                viewBox="0 0 400 250"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  d="M60 118 Q180 40 320 70"
                  fill="none"
                  stroke="var(--sp-trail)"
                  strokeWidth="3"
                  strokeDasharray="3 10"
                  strokeLinecap="round"
                />
              </svg>
              <Rocket fuel={fuel} boost={boost} />
              <div className="sp-fuel">
                <div className="sp-fuel-head">
                  <span>⛽ {t("space.fuel")}</span>
                  <span>{Math.round(fuel)}%</span>
                </div>
                <div
                  className="sp-bar"
                  role="progressbar"
                  aria-valuenow={Math.round(fuel)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t("space.fuel")}
                >
                  <span style={{ width: `${fuel}%` }} />
                </div>
              </div>
            </div>
            <div className="sp-chips">
              <span>📘 {unit}</span>
              <span>🗓 {t("dashboardWidgets.week", { week })}</span>
              <span>
                ✅{" "}
                {t("dashboardWidgets.completed", {
                  percentage: Math.round(fuel),
                })}
              </span>
            </div>
          </>
        ) : (
          <div className="sp-panel sp-empty mt-4">
            <div>🔭</div>
            <b>{t("dashboard.noGroup")}</b>
          </div>
        )}

        <div className="sp-sec">
          <h2>{t("space.myResults")}</h2>
        </div>
        <div className="sp-stats">
          <div className="sp-s">
            <div>🏆</div>
            <b>{myRank ?? "-"}</b>
            <small>{t("dashboard.rank")}</small>
          </div>
          <Link to="/attendance" className="sp-s">
            <div>📅</div>
            <b>{attendance?.stats.present ?? 0}</b>
            <small>{t("dashboard.attendedDays")}</small>
          </Link>
          <Link to="/coins" className="sp-s">
            <div>💎</div>
            <b>+{coinsThisMonth}</b>
            <small>{t("space.thisMonth")}</small>
          </Link>
        </div>
      </div>

      <div className="sp-col sp-col-side">
        <div className="sp-sec">
          <h2>{t("space.todayMissions")}</h2>
          {missions.data && missions.data.total > 0 && (
            <small>
              {missions.data.completed}/{missions.data.total}
            </small>
          )}
        </div>
        {missions.isLoading ? (
          <MissionsSkeleton />
        ) : missions.data ? (
          <Missions
            data={missions.data}
            onClaimed={(allDone) =>
              setBoost((b) => ({
                kind: allDone ? "launch" : "turbo",
                id: (b?.id ?? 0) + 1,
              }))
            }
          />
        ) : (
          <ErrorState onRetry={() => missions.refetch()} />
        )}

        <div className="sp-sec">
          <h2>{t("space.crew")}</h2>
          <div className="sp-tabs" role="tablist">
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
            <div className="sp-empty">{t("dashboardWidgets.noData")}</div>
          ) : (
            <>
              {crew.map((_, i) => renderMember(i))}
              {showMeBelow && renderMember(myIndex)}
            </>
          )}
        </div>
      </div>

      {missions.data && (
        <DailyChest
          opened={missions.data.chest.opened}
          reward={missions.data.chest.reward}
        />
      )}
    </div>
  );
};
