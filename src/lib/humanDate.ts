// src/lib/humanDate.ts
// Plain-language dates for lists: "Bugun", "Kecha", "Ertaga", "24-noyabr"
// (+ year only when it is not this year), optionally with the time.
// Strings live in src/student/i18n/when.ts (merged into the global dictionary).
type T = (key: string, vars?: Record<string, string | number>) => string;
type DateInput = string | Date | null | undefined;

const pad = (n: number) => String(n).padStart(2, "0");
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const toDate = (v: DateInput) => (v ? (v instanceof Date ? v : new Date(v)) : null);

/** Whole days from today to `date` (negative = past). */
export const dayDiff = (date: Date, now = new Date()) => Math.round((startOfDay(date) - startOfDay(now)) / 86_400_000);

/** "Bugun" / "Kecha" / "Ertaga" / "24-noyabr" / "24-noyabr 2025". */
export const humanDay = (value: DateInput, t: T, now = new Date()): string => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "—";
  const diff = dayDiff(date, now);
  if (diff === 0) return t("when.today");
  if (diff === -1) return t("when.yesterday");
  if (diff === 1) return t("when.tomorrow");
  const month = t("when.months").split(",")[date.getMonth()] ?? "";
  const text = t("when.dayMonth", { d: date.getDate(), month });
  return date.getFullYear() === now.getFullYear() ? text : `${text} ${date.getFullYear()}`;
};

/** "Bugun, 14:05" / "24-noyabr, 09:30". */
export const humanDateTime = (value: DateInput, t: T, now = new Date()): string => {
  const date = toDate(value);
  if (!date || Number.isNaN(date.getTime())) return "—";
  return `${humanDay(date, t, now)}, ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
