// src/utils/schedule.ts — reads a group's free-text weekly schedule
// ("Dush, Chor, Jum" / "пн-ср" / "Mon,Wed" and "14:00"). Mirrors
// parseScheduleDays in the frontend (src/teacher/components/ui.tsx).

const DAY_STEMS: string[][] = [
  ["dush", "du", "пн", "пон", "mon"],
  ["sesh", "se", "вт", "вто", "tue"],
  ["chor", "cho", "ср", "сре", "wed"],
  ["pay", "чт", "чет", "thu"],
  ["jum", "ju", "пт", "пят", "fri"],
  ["shan", "sha", "сб", "суб", "sat"],
];

/** Weekday indexes (Mon = 0 … Sat = 5) named in a schedule string. */
export function parseScheduleDays(days: string | null | undefined): number[] {
  if (!days) return [];
  const tokens = days.toLowerCase().split(/[\s,;/]+/).filter(Boolean);
  const indexOf = (token: string) => DAY_STEMS.findIndex((stems) => stems.some((stem) => token.startsWith(stem)));
  const found = new Set<number>();
  for (const token of tokens) {
    const range = token.split(/[-–—]/);
    if (range.length === 2) {
      const a = indexOf(range[0]!);
      const b = indexOf(range[1]!);
      if (a >= 0 && b >= a) {
        for (let i = a; i <= b; i++) found.add(i);
        continue;
      }
    }
    const i = indexOf(token);
    if (i >= 0) found.add(i);
  }
  return [...found].sort((a, b) => a - b);
}

/** Minutes after midnight of a "14:00"-style start time, or null. */
export function parseScheduleTime(time: string | null | undefined): number | null {
  const m = /^(\d{1,2})[:.](\d{2})/.exec((time ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : null;
}
