// src/modules/homework/homework.reminders.ts — 2 hours before a homework's
// deadline, students who haven't submitted it get a Telegram reminder.
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { liveEnrollment } from "../../utils/teacherScope.js";
import { homeworkReminderMessage, notifyStudents } from "../telegram/telegram.notify.js";

export const HOMEWORK_REMINDER_MS = 2 * 60 * 60_000;

/**
 * For a new homework: a deadline already less than 2 hours away gets no
 * separate reminder (the "new homework" message is it).
 */
export const homeworkReminderField = (deadline: Date, now = new Date()) => ({
  reminderSentAt: deadline.getTime() - now.getTime() <= HOMEWORK_REMINDER_MS ? now : null,
});

/** One pass: reminds non-submitters of homework due within the next 2 hours. */
export async function checkHomeworkDeadlines(now = new Date()) {
  const due = await prisma.homework.findMany({
    where: {
      reminderSentAt: null,
      deadline: { gt: now, lte: new Date(now.getTime() + HOMEWORK_REMINDER_MS) },
    },
    select: {
      id: true,
      title: true,
      deadline: true,
      Submission: { select: { studentId: true } },
      Lesson: {
        select: {
          Group: { select: { name: true, Enrollment: { where: liveEnrollment, select: { studentId: true } } } },
        },
      },
    },
    take: 200,
  });

  let reminded = 0;
  for (const hw of due) {
    // Conditional update: a homework is reminded once even if two passes overlap.
    const { count } = await prisma.homework.updateMany({
      where: { id: hw.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (!count) continue;
    const submitted = new Set(hw.Submission.map((s) => s.studentId));
    const group = hw.Lesson.Group;
    const messages = group.Enrollment.filter((e) => !submitted.has(e.studentId)).map((e) =>
      homeworkReminderMessage(e.studentId, hw, group.name),
    );
    reminded += messages.length;
    notifyStudents(messages);
  }
  if (due.length) logger.info("Homework deadlines checked", { homework: due.length, reminded });
}

/** Runs the check every 5 minutes (first one a minute after start). */
export function startHomeworkReminderWatcher() {
  const run = () => checkHomeworkDeadlines().catch((error) => logger.error("Homework reminder check failed", { error }));
  const first = setTimeout(run, 60_000);
  const timer = setInterval(run, 5 * 60_000);
  first.unref();
  timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
