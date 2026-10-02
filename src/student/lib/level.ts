// src/student/lib/level.ts
// Course level ladder, derived from the group's course name. Shared by the
// student HUD (level caption) and the dashboard orbit (current → next planet).
import type { DashboardGroup } from "@/types/notification";

export const LEVELS = [
  "Beginner",
  "Elementary",
  "Pre-Intermediate",
  "Intermediate",
  "Basic IELTS / CEFER",
  "Full IELTS",
] as const;

export type Level = (typeof LEVELS)[number];

export const getLevelFromCourse = (courseName: string): Level => {
  const n = courseName.toLowerCase();
  if (n.includes("full ielts")) return "Full IELTS";
  if (n.includes("basic ielts")) return "Basic IELTS / CEFER";
  if (n.includes("pre-intermediate")) return "Pre-Intermediate";
  if (n.includes("intermediate")) return "Intermediate";
  if (n.includes("elementary")) return "Elementary";
  if (n.includes("beginner")) return "Beginner";
  return "Basic IELTS / CEFER";
};

/** 1-based position on the ladder ("1-daraja" for Beginner). */
export const getLevelNumber = (level: Level): number => LEVELS.indexOf(level) + 1;

export const getNextLevel = (level: Level): Level | null =>
  LEVELS[LEVELS.indexOf(level) + 1] ?? null;

export const getGroupCourseName = (group: DashboardGroup): string =>
  group.courseName ?? group.name ?? group.groupName ?? "Kurs";

export const getGroupName = (group: DashboardGroup): string =>
  group.groupName ?? group.name ?? "Guruh";
