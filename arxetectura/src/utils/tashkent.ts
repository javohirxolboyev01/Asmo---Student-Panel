// src/utils/tashkent.ts — wall-clock helpers for the school's time zone.
// The server itself may run in UTC (Railway), but "today", "this week" and a
// group's "14:00" all mean Tashkent time. Uzbekistan has no DST: UTC+5 always.
export const TASHKENT_OFFSET_MS = 5 * 60 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

/** The same instant shifted so its UTC fields read as Tashkent wall time. */
const wall = (d: Date) => new Date(d.getTime() + TASHKENT_OFFSET_MS);

/** Tashkent midnight that starts the day containing `d`. */
export const tashkentDayStart = (d = new Date()) => {
  const w = wall(d);
  return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth(), w.getUTCDate()) - TASHKENT_OFFSET_MS);
};

/** Weekday of `d` in Tashkent, Monday = 0 … Sunday = 6. */
export const tashkentWeekday = (d = new Date()) => (wall(d).getUTCDay() + 6) % 7;

/** Tashkent Monday 00:00 of the week containing `d`. */
export const tashkentWeekStart = (d = new Date()) =>
  new Date(tashkentDayStart(d).getTime() - tashkentWeekday(d) * DAY_MS);

/** "HH:MM" in Tashkent. */
export const tashkentHHMM = (d: Date) => wall(d).toISOString().slice(11, 16);

/** "YYYY-MM-DD" in Tashkent. */
export const tashkentDateKey = (d: Date) => wall(d).toISOString().slice(0, 10);

export const addDays = (d: Date, days: number) => new Date(d.getTime() + days * DAY_MS);
