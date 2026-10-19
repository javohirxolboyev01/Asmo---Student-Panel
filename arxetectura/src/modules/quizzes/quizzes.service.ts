// src/modules/quizzes/quizzes.service.ts — teacher-made multiple-choice tests.
// The server keeps the correct answers and does all the scoring; a student
// only ever receives question text + options in a per-attempt shuffled order.
import { prisma } from "../../lib/prisma.js";

/** Extra seconds after the time limit, so a submit that's in flight still counts. */
const GRACE_MS = 30_000;

/** Quizzes a student may open: global ones + their active groups' ones. */
export async function visibleQuizWhere(studentId: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, status: "ACTIVE" },
    select: { groupId: true },
  });
  return {
    isActive: true,
    OR: [{ groupId: null }, { groupId: { in: enrollments.map((e) => e.groupId) } }],
  };
}

// Small deterministic PRNG: the same attempt always gets the same order, so
// nothing about the shuffle has to be stored.
const seedOf = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
};
const rng = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffled = <T>(items: T[], seed: string) => {
  const next = rng(seedOf(seed));
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const swap = out[i]!;
    out[i] = out[j]!;
    out[j] = swap;
  }
  return out;
};

type Question = { id: string; text: string; options: string[]; correctIndex: number };

/** Questions as a student sees them: shuffled, no answers, options keep their original index. */
export const playableQuestions = (questions: Question[], attemptId: string) =>
  shuffled(questions, attemptId).map((q) => ({
    id: q.id,
    text: q.text,
    options: shuffled(
      q.options.map((text, index) => ({ index, text })),
      `${attemptId}:${q.id}`,
    ),
  }));

export const scoreAnswers = (questions: Question[], answers: Record<string, number>) =>
  questions.reduce((sum, q) => sum + (answers[q.id] === q.correctIndex ? 1 : 0), 0);

export const attemptDeadline = (startedAt: Date, timeLimitMin: number | null) =>
  timeLimitMin ? new Date(startedAt.getTime() + timeLimitMin * 60_000) : null;

export const isExpired = (deadline: Date | null, now = Date.now()) =>
  Boolean(deadline && now > deadline.getTime() + GRACE_MS);

export const percentOf = (score: number, total: number) => (total > 0 ? Math.round((score * 100) / total) : 0);
