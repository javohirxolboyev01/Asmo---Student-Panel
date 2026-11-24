// src/teacher/pages/DashboardPage.tsx
// Teacher home, 1:1 with the mock `home` view: greeting hero with the next
// lesson, "Bugun nima qilaman?" tiles, this week's schedule strip, upcoming
// lessons, students who need attention and the latest coins.
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Check, ClipboardCheck, Coins, Moon, Plus, Sun } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useTeacherDashboardQuery } from "@/hooks/queries/useDashboard";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { useTeacherCoinTransactionsQuery } from "@/hooks/queries/useCoins";
import { Button } from "@/components/ui";
import { UpcomingLessons } from "@/components/Dashboard/UpcomingLessons";
import { getErrorMessage } from "@/lib/toast";
import type { Group } from "@/types/group";
import { AddLessonSheet } from "../components/sheets";
import { Avatar, DAY_SHORT, EmptyBox, SectionHead, Skel, Tag, parseScheduleDays } from "../components/ui";

const MINUTE = 60_000;
const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
/** Weekday index with Monday = 0 (Sunday = 6). */
const weekIdx = (d: Date) => (d.getDay() + 6) % 7;

type NextSlot =
  | { kind: "lesson"; id: string; title: string; groupName: string; at: Date }
  | { kind: "schedule"; group: Group; at: Date };

/** Next class from the active groups' weekly schedules (mock `nextLesson`). */
const nextScheduled = (groups: Group[], now: Date): { group: Group; at: Date } | null => {
  let best: { group: Group; at: Date } | null = null;
  for (const group of groups) {
    const days = parseScheduleDays(group.schedule?.days);
    const time = /^(\d{1,2}):(\d{2})/.exec(group.schedule?.time ?? "");
    if (!days.length || !time) continue;
    for (let k = 0; k < 8; k++) {
      const at = new Date(now);
      at.setDate(now.getDate() + k);
      if (!days.includes(weekIdx(at))) continue;
      at.setHours(Number(time[1]), Number(time[2]), 0, 0);
      // A class that started over 90 minutes ago is over.
      if (at.getTime() - now.getTime() < -90 * MINUTE) continue;
      if (!best || at < best.at) best = { group, at };
      break;
    }
  }
  return best;
};

export const DashboardPage = () => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data, isLoading, error, refetch } = useTeacherDashboardQuery();
  const { data: groups = [] } = useGroupsQuery();
  const { data: students, isLoading: studentsLoading } = useStudentsQuery();
  const { data: coins, isLoading: coinsLoading } = useTeacherCoinTransactionsQuery();
  const [lessonSheet, setLessonSheet] = useState<{ open: boolean; groupId?: string }>({ open: false });

  // Re-render every minute so "N daqiqadan keyin" and the greeting stay fresh.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), MINUTE);
    return () => window.clearInterval(timer);
  }, []);

  const activeGroups = useMemo(() => groups.filter((g) => g.status === "active"), [groups]);
  const groupDays = useMemo(
    () => activeGroups.map((g) => parseScheduleDays(g.schedule?.days)),
    [activeGroups],
  );

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="h-[236px] rounded-[28px]" />
        <Skel className="mb-3 mt-[26px] h-7 w-56 rounded-lg" />
        <div className="u-tiles">
          {Array.from({ length: 4 }, (_, i) => (
            <Skel key={i} className="h-[150px]" />
          ))}
        </div>
        <Skel className="mb-3 mt-[26px] h-7 w-32 rounded-lg" />
        <Skel className="h-[86px] rounded-[18px]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyBox
        tone="er"
        icon={AlertTriangle}
        title={error ? getErrorMessage(error, t("common.error")) : t("common.error")}
        action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
      />
    );
  }

  // ── Hero ──
  const hour = now.getHours();
  const hi =
    hour < 5 ? t("us.home.night") : hour < 12 ? t("us.home.morning") : hour < 18 ? t("us.home.day") : t("us.home.evening");
  const night = hour < 6 || hour >= 19;
  const firstName = user?.firstName || data.user.firstName;
  const todayIdx = weekIdx(now);
  const scheduledToday = groupDays.filter((d) => d.includes(todayIdx)).length;
  const todayCount = data.stats.todayLessonsCount || scheduledToday;
  const pending = data.stats.pendingGradingCount;
  const line =
    todayCount && pending
      ? t("us.home.lineBoth", { n: todayCount, m: pending })
      : todayCount
        ? t("us.home.lineLessons", { n: todayCount })
        : pending
          ? t("us.home.linePending", { m: pending })
          : t("us.home.allGood");

  const upcoming = data.upcomingLessons;
  const first = upcoming[0];
  const scheduled = first ? null : nextScheduled(activeGroups, now);
  const next: NextSlot | null = first
    ? { kind: "lesson", id: first.id, title: first.topic, groupName: first.groupName, at: new Date(first.lessonDate) }
    : scheduled
      ? { kind: "schedule", ...scheduled }
      : null;

  const whenText = (at: Date) => {
    const minutes = Math.round((at.getTime() - now.getTime()) / MINUTE);
    if (minutes <= 0) return t("us.home.ongoing");
    const dayDiff = Math.round((startOfDay(at) - startOfDay(now)) / (24 * 60 * MINUTE));
    const weekdays = t("dashboardWidgets.weekdays").split(",");
    const day =
      dayDiff === 0 ? t("us.home.today") : dayDiff === 1 ? t("us.home.tomorrow") : weekdays[at.getDay()] ?? "";
    const rel =
      minutes < 60
        ? t("us.home.inMin", { m: minutes })
        : minutes < 24 * 60
          ? t("us.home.inHours", { h: Math.floor(minutes / 60), m: minutes % 60 })
          : dayDiff > 1
            ? t("when.inDays", { n: dayDiff })
            : "";
    return `${day}, ${hhmm(at)}${rel ? ` · ${rel}` : ""}`;
  };

  // Attendance tile: straight to today's lesson when there is one.
  const todayLesson = first && startOfDay(new Date(first.lessonDate)) === startOfDay(now) ? first : null;

  // ── Week strip ──
  // Lessons run Monday–Saturday, so the week always shows all six days.
  const perDay = DAY_SHORT.map((_, i) => groupDays.filter((d) => d.includes(i)).length);

  // ── Attention + coins ──
  const care = (students ?? []).filter((s) => s.groups.length === 0 || s.attendancePercentage < 50);
  const avatarOf = new Map((students ?? []).map((s) => [s.id, s.avatar]));
  const latestCoins = [...(coins ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const tileIcon = (Icon: typeof Check, fg: string, bg: string) => (
    <span className="c" style={{ background: bg, color: fg }}>
      <Icon className="u-i l" strokeWidth={2} aria-hidden="true" />
    </span>
  );

  return (
    <div>
      <section className="u-hero">
        <span className="u-gl" aria-hidden="true">
          {night ? <Moon className="u-i" strokeWidth={2} /> : <Sun className="u-i" strokeWidth={2} />}
        </span>
        <h1>{t("us.home.greeting", { hi, name: firstName })}</h1>
        <p>{line}</p>
        {next && (
          <div className="u-nl">
            <div className="min-w-0">
              <small>{t("us.home.next")}</small>
              <b className="break-words">{next.kind === "lesson" ? next.title : next.group.name}</b>
              <small>
                {next.kind === "lesson" ? `${next.groupName} · ` : ""}
                {whenText(next.at)}
              </small>
            </div>
            {next.kind === "lesson" ? (
              <Link to={`/lessons/${next.id}`} className="u-btn wh">
                <Check className="u-i m" strokeWidth={2} aria-hidden="true" />
                {t("us.home.takeAttendance")}
              </Link>
            ) : (
              <button
                type="button"
                className="u-btn wh"
                onClick={() => setLessonSheet({ open: true, groupId: next.group.id })}
              >
                <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
                {t("groupDetail.addLesson")}
              </button>
            )}
          </div>
        )}
      </section>

      <SectionHead title={t("us.home.todo")} className="u-sec" />
      <div className="u-tiles">
        {pending > 0 ? (
          <Link to="/grading" className="u-tile hot">
            {tileIcon(ClipboardCheck, "var(--er)", "var(--ert)")}
            <div>
              <b>{t("us.home.gradeTitle")}</b>
              <span>{t("us.home.gradeSub", { n: pending })}</span>
            </div>
            <i className="n">{pending > 99 ? "99+" : pending}</i>
          </Link>
        ) : (
          <Link to="/grading" className="u-tile">
            {tileIcon(ClipboardCheck, "var(--ok)", "var(--okt)")}
            <div>
              <b>{t("us.home.gradeTitle")}</b>
              <span>{t("us.home.gradeDoneSub")}</span>
            </div>
          </Link>
        )}
        <Link to={todayLesson ? `/lessons/${todayLesson.id}` : "/groups"} className="u-tile">
          {tileIcon(Check, "var(--pr)", "var(--prt)")}
          <div>
            <b>{t("us.home.takeAttendance")}</b>
            <span>{todayCount ? t("us.home.attendSub", { n: todayCount }) : t("us.home.attendNone")}</span>
          </div>
        </Link>
        <Link to="/coins" className="u-tile">
          {tileIcon(Coins, "var(--gdx)", "var(--gdt)")}
          <div>
            <b>{t("us.coin.title")}</b>
            <span>{t("us.home.coinSub")}</span>
          </div>
        </Link>
        <button type="button" className="u-tile" onClick={() => setLessonSheet({ open: true })}>
          {tileIcon(Plus, "var(--pr)", "var(--prt)")}
          <div>
            <b>{t("groupDetail.addLesson")}</b>
            <span>{t("us.home.lessonSub")}</span>
          </div>
        </button>
      </div>

      <SectionHead title={t("us.home.week")} className="u-sec" />
      <div
        className="u-week"
        style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
      >
        {perDay.map((n, i) => (
          <div
            key={DAY_SHORT[i]}
            className={i === todayIdx ? "now" : n ? "on" : undefined}
            aria-current={i === todayIdx ? "date" : undefined}
          >
            {DAY_SHORT[i]}
            <i />
            <small className="text-xs font-semibold">{n ? t("us.home.weekLessons", { n }) : "—"}</small>
          </div>
        ))}
      </div>

      <UpcomingLessons className="u-sec" lessons={upcoming} />

      <div className="u-two e u-sec">
        <div className="min-w-0">
          <SectionHead
            title={t("us.home.care")}
            right={
              care.length > 5 ? (
                <Link to="/students" className="u-chip">
                  {t("us.home.all")}
                </Link>
              ) : undefined
            }
          />
          <div className="u-stack">
            {studentsLoading ? (
              Array.from({ length: 3 }, (_, i) => <Skel key={i} className="h-[62px] rounded-[18px]" />)
            ) : care.length === 0 ? (
              <EmptyBox title={t("us.home.careEmpty")} text={t("us.home.careEmptySub")} />
            ) : (
              care.slice(0, 5).map((s) => {
                const name = `${s.firstName} ${s.lastName}`.trim();
                const noGroup = s.groups.length === 0;
                return (
                  <Link key={s.id} to={`/students/${s.id}`} className="u-row">
                    <Avatar name={name} src={s.avatar} seed={s.id} size="s" />
                    <div className="g">
                      <b className="truncate">{name}</b>
                      <small>
                        {noGroup ? t("us.home.noGroup") : t("us.home.attendance", { n: s.attendancePercentage })}
                      </small>
                    </div>
                    <Tag tone="gd">{noGroup ? t("us.home.tagNoGroup") : t("us.home.tagLow")}</Tag>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="min-w-0">
          <SectionHead
            title={t("us.home.coins")}
            right={
              <Link to="/coins" className="u-chip">
                {t("us.home.all")}
              </Link>
            }
          />
          <div className="u-stack">
            {coinsLoading ? (
              Array.from({ length: 3 }, (_, i) => <Skel key={i} className="h-[62px] rounded-[18px]" />)
            ) : latestCoins.length === 0 ? (
              <EmptyBox
                tone="mu"
                icon={Coins}
                title={t("us.home.coinsEmpty")}
                text={t("us.home.coinsEmptySub")}
                action={
                  <Link to="/coins" className="u-btn">
                    {t("us.coin.title")}
                  </Link>
                }
              />
            ) : (
              latestCoins.map((c) => (
                <div key={c.id} className="u-row">
                  <Avatar name={c.studentName} src={avatarOf.get(c.userId)} seed={c.userId} size="s" />
                  <div className="g">
                    <b className="truncate">{c.studentName}</b>
                    <small className="block truncate">{c.reason}</small>
                  </div>
                  <b
                    className="u-fd flex-none text-[19px]"
                    style={{ color: c.amount > 0 ? "var(--ok)" : "var(--er)" }}
                  >
                    {c.amount > 0 ? "+" : ""}
                    {c.amount} <small className="text-[13px] font-bold">{t("unit.coin")}</small>
                  </b>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <AddLessonSheet
        open={lessonSheet.open}
        groupId={lessonSheet.groupId}
        onClose={() => setLessonSheet({ open: false })}
      />
    </div>
  );
};
