// src/modules/lessons/lesson.reminders.ts — 30 minutes before a class the
// group's teacher gets a notification (in the app's bell, and on Telegram when
// the teacher's account is linked to it).
//
// A class is either a created lesson (Lesson row, status PLANNED) or, on a
// day with no lesson row for that group, the group's weekly schedule
// ("Dush, Chor, Jum" at "14:00"). Each class is reminded once: the
// LessonReminder row is the dedupe key, inserted before anything is sent.
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { newId } from "../../utils/ids.js";
import { parseScheduleDays, parseScheduleTime } from "../../utils/schedule.js";
import { addDays, tashkentDateKey, tashkentDayStart, tashkentHHMM, tashkentWeekday } from "../../utils/tashkent.js";
import { escapeHtml } from "../telegram/telegram.bot.js";
import { notifyStudents } from "../telegram/telegram.notify.js";

export const LESSON_REMINDER_MS = 30 * 60_000;
export const LESSON_REMINDER_TYPE = "LESSON_REMINDER";
/** Notification title; the frontend shows it translated (lib/notificationTitle). */
export const LESSON_REMINDER_TITLE = "Lesson starts soon";

export const lessonReminderKey = (lessonId: string) => `lesson:${lessonId}`;

interface Upcoming {
  key: string;
  teacherUserId: string;
  groupName: string;
  topic: string | null;
  at: Date;
  /** Notification relatedId: a lesson id, or "group:<id>" for a scheduled class. */
  relatedId: string;
}

const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

/** Classes starting within the next 30 minutes whose teacher can be notified. */
async function upcomingClasses(now: Date): Promise<Upcoming[]> {
  const until = new Date(now.getTime() + LESSON_REMINDER_MS);
  const dayStart = tashkentDayStart(now);
  const dayEnd = addDays(dayStart, 1);

  const [lessons, groups] = await Promise.all([
    prisma.lesson.findMany({
      where: { status: "PLANNED", lessonDate: { gt: now, lte: until } },
      select: {
        id: true,
        topic: true,
        lessonDate: true,
        Group: { select: { name: true, Teacher: { select: { userId: true } } } },
      },
      take: 200,
    }),
    prisma.group.findMany({
      where: { status: "ACTIVE", scheduleDays: { not: "" }, scheduleTime: { not: "" }, Teacher: { userId: { not: null } } },
      select: { id: true, name: true, scheduleDays: true, scheduleTime: true, Teacher: { select: { userId: true } } },
    }),
  ]);

  const result: Upcoming[] = [];
  for (const lesson of lessons) {
    const teacherUserId = lesson.Group.Teacher.userId;
    if (!teacherUserId) continue;
    result.push({
      key: lessonReminderKey(lesson.id),
      teacherUserId,
      groupName: lesson.Group.name,
      topic: lesson.topic,
      at: lesson.lessonDate,
      relatedId: lesson.id,
    });
  }

  // Scheduled classes today that start within the window.
  const weekday = tashkentWeekday(now);
  const due = groups.flatMap((group) => {
    const minutes = parseScheduleTime(group.scheduleTime);
    if (minutes === null || !parseScheduleDays(group.scheduleDays).includes(weekday)) return [];
    const at = new Date(dayStart.getTime() + minutes * 60_000);
    return at > now && at <= until ? [{ group, at }] : [];
  });
  if (due.length) {
    // A lesson created for today (any status) replaces the schedule: its own
    // time is used, and a cancelled one means no class.
    const withLesson = new Set(
      (
        await prisma.lesson.findMany({
          where: { groupId: { in: due.map((d) => d.group.id) }, lessonDate: { gte: dayStart, lt: dayEnd } },
          select: { groupId: true },
        })
      ).map((l) => l.groupId),
    );
    for (const { group, at } of due) {
      if (withLesson.has(group.id)) continue;
      result.push({
        key: `group:${group.id}:${tashkentDateKey(at)}`,
        teacherUserId: group.Teacher.userId!,
        groupName: group.name,
        topic: null,
        at,
        relatedId: `group:${group.id}`,
      });
    }
  }
  return result;
}

const telegramText = (c: Upcoming, minutes: number) =>
  [
    `⏰ <b>Dars ${minutes} daqiqadan keyin boshlanadi</b>`,
    "",
    `👥 Guruh: ${escapeHtml(c.groupName)}`,
    ...(c.topic ? [`📖 Mavzu: ${escapeHtml(c.topic)}`] : []),
    `🕒 Vaqt: <b>${tashkentHHMM(c.at)}</b>`,
  ].join("\n");

/** One pass: notifies teachers of classes starting in the next 30 minutes. */
export async function checkLessonReminders(now = new Date()) {
  const classes = await upcomingClasses(now);
  let sent = 0;
  for (const c of classes) {
    // Insert-first dedupe: two overlapping passes can't both send.
    try {
      await prisma.lessonReminder.create({ data: { id: c.key, sentAt: now } });
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
    const minutes = Math.max(1, Math.round((c.at.getTime() - now.getTime()) / 60_000));
    await prisma.notification.create({
      data: {
        id: newId(),
        userId: c.teacherUserId,
        type: LESSON_REMINDER_TYPE,
        title: LESSON_REMINDER_TITLE,
        message: [c.groupName, tashkentHHMM(c.at), c.topic].filter(Boolean).join(" · "),
        relatedId: c.relatedId,
      },
    });
    // Sent by user id; skipped unless the teacher's account has Telegram linked.
    notifyStudents([{ studentId: c.teacherUserId, text: telegramText(c, minutes) }]);
    sent++;
  }
  if (sent) logger.info("Lesson reminders sent", { sent });
}

/** Old dedupe rows are useless once their class is over. */
async function pruneReminders(now: Date) {
  await prisma.lessonReminder.deleteMany({ where: { sentAt: { lt: addDays(now, -7) } } });
}

/**
 * A lesson moved to a new time should be reminded again; called after a
 * lesson's date changes.
 */
export const resetLessonReminder = (lessonId: string) =>
  prisma.lessonReminder.deleteMany({ where: { id: lessonReminderKey(lessonId) } }).catch((error) => {
    logger.warn("Lesson reminder reset failed", { error });
  });

/** Checks every minute (first one 30 s after start); prunes once an hour. */
export function startLessonReminderWatcher() {
  let runs = 0;
  const run = () => {
    const now = new Date();
    checkLessonReminders(now).catch((error) => logger.error("Lesson reminder check failed", { error }));
    if (runs++ % 60 === 0) pruneReminders(now).catch((error) => logger.error("Lesson reminder prune failed", { error }));
  };
  const first = setTimeout(run, 30_000);
  const timer = setInterval(run, 60_000);
  first.unref();
  timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
