// src/student/pages/AttendancePage.tsx
// "Kosmik maktab" attendance: % pill, weekly/monthly calendar with real marks
// from the attendance API, and the full records list.
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAttendanceQuery } from "@/hooks/queries/useAttendance";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import { formatDate } from "@/utilist/formatData";
import type { AttendanceRecord } from "@/types/attendance";
import { EmptyState, ErrorState, Modal, PageHeader, Segmented, Skel } from "../components/ui";
import "../theme/attendance.css";

type ViewMode = "weekly" | "monthly";

const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Monday of the week containing `d`. */
const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));

const AttendanceSkeleton = () => (
  <div className="sp-page" aria-busy="true">
    <Skel className="mt-5 h-9 w-2/3" />
    <Skel className="mt-2 h-4 w-1/2" />
    <Skel className="mt-4 h-12 rounded-full" />
    <div className="sp-g3">
      <Skel className="h-20" />
      <Skel className="h-20" />
      <Skel className="h-20" />
    </div>
    <Skel className="mt-3.5 h-80" />
    <Skel className="mt-3.5 h-56" />
  </div>
);

export const AttendancePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAttendanceQuery();
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");
  const [focus, setFocus] = useState(() => startOfDay(new Date()));
  const [dayModal, setDayModal] = useState<{ date: Date; records: AttendanceRecord[] } | null>(null);

  // Several groups can have a lesson on the same day, so keep every record.
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord[]>();
    (data?.records ?? []).forEach((r) => {
      const d = new Date(r.lessonDate);
      if (Number.isNaN(d.getTime())) return;
      const k = dayKey(d);
      map.set(k, [...(map.get(k) ?? []), r]);
    });
    return map;
  }, [data]);

  const sortedRecords = useMemo(
    () =>
      [...(data?.records ?? [])].sort(
        (a, b) => (new Date(b.lessonDate).getTime() || 0) - (new Date(a.lessonDate).getTime() || 0),
      ),
    [data],
  );

  if (isLoading) return <AttendanceSkeleton />;

  // Cached data wins over a failed background refetch (offline, flaky network).
  if (!data) {
    return (
      <div className="sp-page">
        <ErrorState
          message={error ? getErrorMessage(error, t("common.notFound")) : t("common.notFound")}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { records } = data;
  const totalLessons = data.stats.total;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const percentage = data.stats.percentage || (totalLessons ? Math.round((present / totalLessons) * 100) : 0);

  const today = startOfDay(new Date());
  const year = focus.getFullYear();
  const month = focus.getMonth();
  const months = t("space.attendance.months").split(",");
  const weekDays = t("attendance.weekDays").split(",");

  // Cells to render: one week row (weekly) or full Mon-first month grid (monthly).
  let cells: Date[];
  let label: string;
  if (viewMode === "weekly") {
    const start = weekStart(focus);
    cells = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const end = cells[6];
    label =
      start.getMonth() === end.getMonth()
        ? `${start.getDate()}–${end.getDate()} ${months[end.getMonth()]}`
        : `${start.getDate()} ${months[start.getMonth()].slice(0, 3)} – ${end.getDate()} ${months[end.getMonth()].slice(0, 3)}`;
    label += ` ${end.getFullYear()}`;
  } else {
    const first = new Date(year, month, 1);
    const start = weekStart(first);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;
    const total = Math.ceil((leading + daysInMonth) / 7) * 7;
    cells = Array.from({ length: total }, (_, i) => addDays(start, i));
    label = `${months[month]} ${year}`;
  }

  const step = (dir: -1 | 1) =>
    setFocus((f) =>
      viewMode === "weekly" ? addDays(f, 7 * dir) : new Date(f.getFullYear(), f.getMonth() + dir, 1),
    );
  const showsToday = cells.some((c) => c.getTime() === today.getTime());

  const openDay = (date: Date, dayRecords: AttendanceRecord[]) => {
    if (dayRecords.length === 1 && dayRecords[0].lessonId) navigate(`/lessons/${dayRecords[0].lessonId}`);
    else setDayModal({ date, records: dayRecords });
  };

  return (
    <div className="sp-page">
      <PageHeader
        title={t("attendance.title")}
        subtitle={t("attendance.subtitle")}
        right={<div className="sp-pill">{percentage}%</div>}
      />

      <Segmented<ViewMode>
        value={viewMode}
        onChange={(m) => {
          setViewMode(m);
          // Re-anchor on today when the visible range no longer contains it.
          if (!showsToday) setFocus(today);
        }}
        options={[
          { value: "weekly", label: t("attendance.weekly") },
          { value: "monthly", label: t("attendance.monthly") },
        ]}
      />

      <div className="sp-g3">
        <div className="sp-s">
          <b>{totalLessons}</b>
          <small>{t("attendance.totalLessons")}</small>
        </div>
        <div className="sp-s">
          <b style={{ color: "var(--sp-lime-ink)" }}>{present}</b>
          <small>{t("attendance.present")}</small>
        </div>
        <div className="sp-s">
          <b style={{ color: "var(--sp-pink-ink)" }}>{absent}</b>
          <small>{t("attendance.absent")}</small>
        </div>
      </div>

      <div className="sp-panel mt-3.5">
        <div className="sp-cnav sp-attendance-cnav">
          <h2>{t("attendance.calendar")}</h2>
          <span className="sp-attendance-nav">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t(viewMode === "weekly" ? "space.attendance.prevWeek" : "space.attendance.prevMonth")}
            >
              ‹
            </button>
            <b aria-live="polite">{label}</b>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t(viewMode === "weekly" ? "space.attendance.nextWeek" : "space.attendance.nextMonth")}
            >
              ›
            </button>
          </span>
        </div>

        <div className="sp-cal sp-head" aria-hidden="true">
          {weekDays.map((d, i) => (
            <i key={i}>{d}</i>
          ))}
        </div>
        <div className="sp-cal">
          {cells.map((date) => {
            const out = viewMode === "monthly" && date.getMonth() !== month;
            if (out) {
              return (
                <div key={date.getTime()} className="sp-cell sp-out" aria-hidden="true">
                  {date.getDate()}
                  <small>&nbsp;</small>
                </div>
              );
            }
            const dayRecords = recordsByDate.get(dayKey(date)) ?? [];
            const has = dayRecords.length > 0;
            const isAbsent = dayRecords.some((r) => r.status === "absent");
            const isToday = date.getTime() === today.getTime();
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isFuture = date.getTime() > today.getTime();

            let cls = "sp-cell sp-attendance-cell";
            let small: string = " ";
            if (has) {
              cls += isAbsent ? " sp-absent" : " sp-present";
              if (isToday) cls += " sp-attendance-ring";
              small = isAbsent ? t("attendance.legendAbsent") : `✓ ${t("attendance.legendPresent")}`;
            } else if (isToday) {
              cls += " sp-today";
              small = t("space.attendance.todayCell");
            } else if (isWeekend) {
              cls += " sp-rest";
              small = t("space.attendance.restCell");
            } else if (isFuture) {
              small = "⏳";
            }

            return (
              <button
                key={date.getTime()}
                type="button"
                className={cls}
                title={dayRecords.map((r) => r.lessonTopic).join(", ") || undefined}
                aria-label={`${formatDate(date)}${small.trim() ? ` · ${small}` : ""}`}
                aria-current={isToday ? "date" : undefined}
                onClick={() => openDay(date, dayRecords)}
              >
                {date.getDate()}
                <small>{small}</small>
              </button>
            );
          })}
        </div>
        {!showsToday && (
          <button type="button" className="sp-attendance-today" onClick={() => setFocus(today)}>
            {t("space.attendance.backToToday")}
          </button>
        )}

        <div className="sp-leg">
          <span>
            <i style={{ background: "var(--sp-lime)" }} />
            {t("attendance.legendPresent")}
          </span>
          <span>
            <i style={{ background: "var(--sp-pink)" }} />
            {t("attendance.legendAbsent")}
          </span>
        </div>
      </div>

      <div className="sp-panel mt-3.5">
        <h2>{t("attendance.allRecords")}</h2>
        {sortedRecords.length === 0 ? (
          <EmptyState
            panel={false}
            emoji="🔭"
            title={t("space.attendance.noRecords")}
            text={t("space.attendance.noRecordsHint")}
          />
        ) : (
          <div>
            {sortedRecords.map((r) => {
              const content = (
                <>
                  <span aria-hidden="true">{r.status === "present" ? "✅" : "🌑"}</span>
                  <span>
                    <span className="block truncate">{r.lessonTopic}</span>
                    <small>{formatDate(r.lessonDate)}</small>
                  </span>
                  <span className={r.status === "present" ? "sp-badge" : "sp-badge sp-pink"}>
                    {r.status === "present" ? t("attendance.legendPresent") : t("attendance.legendAbsent")}
                  </span>
                </>
              );
              return r.lessonId ? (
                <Link key={r.id} to={`/lessons/${r.lessonId}`} className="sp-hr sp-attendance-row">
                  {content}
                </Link>
              ) : (
                <div key={r.id} className="sp-hr">
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={dayModal !== null} onClose={() => setDayModal(null)} labelledBy="sp-attendance-day">
        {dayModal && (
          <>
            <div className="text-5xl" aria-hidden="true">
              {dayModal.records.length ? "📚" : "🪐"}
            </div>
            <h2 id="sp-attendance-day">
              {dayModal.records.length ? t("space.attendance.dayLessons") : t("attendance.noLessonTitle")}
            </h2>
            <p>{formatDate(dayModal.date)}</p>
            {dayModal.records.length === 0 ? (
              <p>{t("attendance.noLessonThisDay")}</p>
            ) : (
              <div className="text-left mb-2">
                {dayModal.records.map((r) => {
                  const inner = (
                    <>
                      <span aria-hidden="true">{r.status === "present" ? "✅" : "🌑"}</span>
                      <span className="truncate">{r.lessonTopic}</span>
                      <span className={r.status === "present" ? "sp-badge" : "sp-badge sp-pink"}>
                        {r.status === "present" ? t("attendance.legendPresent") : t("attendance.legendAbsent")}
                      </span>
                    </>
                  );
                  return r.lessonId ? (
                    <Link key={r.id} to={`/lessons/${r.lessonId}`} className="sp-hr sp-attendance-row">
                      {inner}
                    </Link>
                  ) : (
                    <div key={r.id} className="sp-hr">
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
            <button className="sp-cta" onClick={() => setDayModal(null)}>
              {t("attendance.backToAttendance")}
            </button>
          </>
        )}
      </Modal>
    </div>
  );
};
