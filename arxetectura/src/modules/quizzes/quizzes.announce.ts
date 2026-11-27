// src/modules/quizzes/quizzes.announce.ts — the first time a test is active,
// its students get a "new test" notification (app bell + Telegram).
// Quiz.announcedAt makes it once per test: editing or re-activating a test
// never notifies again.
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { newId } from "../../utils/ids.js";
import { liveEnrollment } from "../../utils/teacherScope.js";
import { escapeHtml } from "../telegram/telegram.bot.js";
import { notifyStudents } from "../telegram/telegram.notify.js";

export const QUIZ_NOTIFICATION_TITLE = "New test";

/**
 * Who sees the test: its group's students, or for a test without a group the
 * students of the creator's groups (an ADMIN's: every enrolled student).
 */
async function recipients(quiz: { groupId: string | null; createdById: string }) {
  if (quiz.groupId) {
    const rows = await prisma.enrollment.findMany({
      where: { groupId: quiz.groupId, ...liveEnrollment },
      select: { studentId: true },
    });
    return [...new Set(rows.map((r) => r.studentId))];
  }
  const creator = await prisma.user.findUnique({ where: { id: quiz.createdById }, select: { role: true } });
  const rows = await prisma.enrollment.findMany({
    where: {
      ...liveEnrollment,
      Group: { status: "ACTIVE", ...(creator?.role === "ADMIN" ? {} : { Teacher: { userId: quiz.createdById } }) },
    },
    select: { studentId: true },
  });
  return [...new Set(rows.map((r) => r.studentId))];
}

/** Announces an active, not yet announced test. Never throws: saving the test already succeeded. */
export async function announceQuiz(quizId: string) {
  try {
    const now = new Date();
    // Conditional claim: concurrent saves announce once.
    const claimed = await prisma.quiz.updateMany({
      where: { id: quizId, isActive: true, announcedAt: null },
      data: { announcedAt: now },
    });
    if (!claimed.count) return;
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: {
        id: true,
        title: true,
        groupId: true,
        createdById: true,
        timeLimitMin: true,
        coinReward: true,
        Group: { select: { name: true } },
        _count: { select: { QuizQuestion: true } },
      },
    });
    if (!quiz) return;
    const students = await recipients(quiz);
    if (!students.length) return;
    await prisma.notification.createMany({
      data: students.map((userId) => ({
        id: newId(),
        userId,
        type: "QUIZ",
        title: QUIZ_NOTIFICATION_TITLE,
        message: quiz.title,
        relatedId: quiz.id,
      })),
    });
    const details = [
      `❓ ${quiz._count.QuizQuestion} ta savol`,
      quiz.timeLimitMin ? `⏱ ${quiz.timeLimitMin} daqiqa` : null,
      quiz.coinReward > 0 ? `🪙 ${quiz.coinReward} coin` : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const text = [
      "📝 <b>Yangi test</b>",
      "",
      `<b>${escapeHtml(quiz.title)}</b>`,
      ...(quiz.Group ? [`👥 Guruh: ${escapeHtml(quiz.Group.name)}`] : []),
      details,
    ].join("\n");
    notifyStudents(students.map((studentId) => ({ studentId, text, openApp: true })));
  } catch (error) {
    logger.error("Quiz announcement failed", { error, quizId });
  }
}
