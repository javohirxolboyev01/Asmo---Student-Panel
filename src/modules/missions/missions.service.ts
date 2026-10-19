// src/modules/missions/missions.service.ts — daily missions, daily chest and
// streak. Every condition is verified on the server against real data
// (submissions, attendance, grades); the client never says "I did it".
import { prisma } from "../../lib/prisma.js";
import { newId } from "../../utils/ids.js";

export const MISSION_TYPES = ["SUBMIT_HOMEWORK", "ATTEND_LESSON", "GOOD_GRADE", "PASS_QUIZ"] as const;
export type MissionType = (typeof MISSION_TYPES)[number];

/**
 * Types teachers can still create and students still see (2026-10-05: the
 * attendance and good-grade missions were retired). Old rows of the retired
 * types stay in the DB for coin history but are hidden everywhere.
 */
export const ACTIVE_MISSION_TYPES = ["SUBMIT_HOMEWORK", "PASS_QUIZ"] as const;
const ACTIVE_TYPES: string[] = [...ACTIVE_MISSION_TYPES];

export const CHEST_REWARDS = [5, 10, 20] as const;

// Asia/Tashkent is UTC+5 all year (no DST), so a fixed offset is exact.
const TZ_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Tashkent calendar day of `date` as "YYYY-MM-DD". */
export const dayKey = (date = new Date()) => new Date(date.getTime() + TZ_OFFSET_MS).toISOString().slice(0, 10);

/** UTC instants bounding a Tashkent calendar day: [start, end). */
export const dayRange = (key: string) => {
  const start = new Date(Date.parse(`${key}T00:00:00Z`) - TZ_OFFSET_MS);
  return { start, end: new Date(start.getTime() + DAY_MS) };
};

const shiftDay = (key: string, days: number) =>
  new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

export const httpError = (status: number, message: string) => Object.assign(new Error(message), { status });

/** Passed = scored at least `target`% (no target = just finishing counts). */
const passed = (score: number, total: number, target: number | null) => total > 0 && score * 100 >= (target ?? 0) * total;

/**
 * Active missions visible to a student today: global ones + their active
 * groups' ones. A test mission is one-off rather than daily, so it needs an
 * active test the student can open, and it drops off once it was claimed on
 * an earlier day or the test was failed on an earlier day.
 */
export async function missionsForStudent(studentId: string, key = dayKey()) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, status: "ACTIVE" },
    select: { groupId: true },
  });
  const groupIds = enrollments.map((e) => e.groupId);
  const missions = await prisma.mission.findMany({
    where: {
      isActive: true,
      type: { in: ACTIVE_TYPES },
      OR: [{ groupId: null }, { groupId: { in: groupIds } }],
    },
    include: { Quiz: { select: { isActive: true, groupId: true } } },
    orderBy: { createdAt: "asc" },
  });

  const quizMissions = missions.filter((m) => m.type === "PASS_QUIZ");
  if (quizMissions.length === 0) return missions;

  const { start } = dayRange(key);
  const [earlierClaims, earlierAttempts] = await Promise.all([
    prisma.missionCompletion.findMany({
      where: { studentId, missionId: { in: quizMissions.map((m) => m.id) }, day: { lt: key } },
      select: { missionId: true },
    }),
    prisma.quizAttempt.findMany({
      where: { studentId, quizId: { in: quizMissions.map((m) => m.quizId!).filter(Boolean) }, finishedAt: { lt: start } },
      select: { quizId: true, score: true, total: true },
    }),
  ]);
  const claimedBefore = new Set(earlierClaims.map((c) => c.missionId));
  const attemptBefore = new Map(earlierAttempts.map((a) => [a.quizId, a]));

  return missions.filter((m) => {
    if (m.type !== "PASS_QUIZ") return true;
    const quiz = m.Quiz;
    if (!quiz?.isActive || (quiz.groupId && !groupIds.includes(quiz.groupId))) return false;
    if (claimedBefore.has(m.id)) return false;
    const old = attemptBefore.get(m.quizId!);
    return !old || passed(old.score ?? 0, old.total, m.target);
  });
}

type Mission = Awaited<ReturnType<typeof missionsForStudent>>[number];

/**
 * Loads today's evidence once (small selects only — submission content and
 * attachments can be megabytes) and returns a checker for any mission.
 */
export async function todayEvidence(studentId: string, key = dayKey()) {
  const { start, end } = dayRange(key);
  const [submitted, graded, attended, quizzes] = await Promise.all([
    prisma.submission.findMany({
      where: { studentId, submittedAt: { gte: start, lt: end } },
      select: { Homework: { select: { Lesson: { select: { groupId: true } } } } },
    }),
    prisma.submission.findMany({
      where: { studentId, status: "GRADED", gradedAt: { gte: start, lt: end }, score: { not: null } },
      select: { score: true, Homework: { select: { maxScore: true, Lesson: { select: { groupId: true } } } } },
    }),
    prisma.attendanceRecord.findMany({
      where: { studentId, status: "PRESENT", Lesson: { lessonDate: { gte: start, lt: end } } },
      select: { Lesson: { select: { groupId: true } } },
    }),
    // A passed test stays claimable until claimed, whichever day it was taken.
    // Only tests that an active mission still points at — not every attempt ever.
    prisma.quizAttempt.findMany({
      where: { studentId, finishedAt: { not: null }, Quiz: { isActive: true, Mission: { some: { isActive: true } } } },
      select: { quizId: true, score: true, total: true },
    }),
  ]);
  const quizAttempt = new Map(quizzes.map((a) => [a.quizId, a]));

  const inScope = (mission: Mission, groupId: string) => !mission.groupId || mission.groupId === groupId;

  return (mission: Mission): boolean => {
    switch (mission.type as MissionType) {
      case "SUBMIT_HOMEWORK":
        return submitted.some((s) => inScope(mission, s.Homework.Lesson.groupId));
      case "ATTEND_LESSON":
        return attended.some((a) => inScope(mission, a.Lesson.groupId));
      case "GOOD_GRADE": {
        const target = mission.target ?? 80;
        return graded.some(
          (s) =>
            inScope(mission, s.Homework.Lesson.groupId) &&
            s.Homework.maxScore > 0 &&
            (s.score ?? 0) * 100 >= target * s.Homework.maxScore,
        );
      }
      case "PASS_QUIZ": {
        const attempt = mission.quizId ? quizAttempt.get(mission.quizId) : undefined;
        return Boolean(attempt && passed(attempt.score ?? 0, attempt.total, mission.target));
      }
      default:
        return false;
    }
  };
}

/**
 * Consecutive Tashkent days with any activity (mission claimed or chest
 * opened), counted back from today — or from yesterday if today has none yet,
 * so the streak doesn't look broken in the morning.
 */
export async function streakFor(studentId: string, today = dayKey()) {
  const since = shiftDay(today, -400);
  const [completions, chests] = await Promise.all([
    prisma.missionCompletion.findMany({ where: { studentId, day: { gte: since } }, select: { day: true }, distinct: ["day"] }),
    prisma.dailyChest.findMany({ where: { studentId, day: { gte: since } }, select: { day: true } }),
  ]);
  const days = new Set([...completions, ...chests].map((x) => x.day));
  let cursor = days.has(today) ? today : shiftDay(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

/** Coins + ledger entry + balance in one transaction step. */
export async function awardCoins(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  studentId: string,
  amount: number,
  reason: string,
  sourceType: "MISSION" | "CHEST",
) {
  await tx.coinTransaction.create({
    data: { id: newId(), studentId, amount, reason, sourceType },
  });
  const user = await tx.user.update({
    where: { id: studentId },
    data: { coinBalance: { increment: amount } },
    select: { coinBalance: true },
  });
  return user.coinBalance;
}
