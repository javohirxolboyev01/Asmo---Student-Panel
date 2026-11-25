// src/modules/payments/payments.tracking.ts — payment due dates: a reminder
// a day before, automatic OVERDUE once the date passes, and Telegram notices
// when a payment is received or becomes overdue.
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import {
  notifyStudents,
  paymentOverdueMessage,
  paymentPaidMessage,
  paymentReminderMessage,
} from "../telegram/telegram.notify.js";

const DAY = 86_400_000;

/**
 * DB fields for a due date given by a teacher (null/undefined = none). A date
 * less than a day away gets no separate reminder: the payment itself is it.
 */
export const dueDateFields = (dueDate: Date | null | undefined, now = new Date()) =>
  dueDate
    ? {
        dueDate,
        hasDueDate: true,
        reminderSentAt: dueDate.getTime() - now.getTime() <= DAY ? now : null,
        overdueNotifiedAt: null,
      }
    : { hasDueDate: false };

type PaymentRow = Parameters<typeof paymentPaidMessage>[0] & {
  id: string;
  status: string;
  overdueNotifiedAt: Date | null;
};

/** Call after a payment is created or updated: tells the student what changed. */
export async function afterPaymentChange(before: { status: string } | null, after: PaymentRow) {
  try {
    if (after.status === "PAID" && before?.status !== "PAID") notifyStudents([paymentPaidMessage(after)]);
    if (after.status === "OVERDUE" && before?.status !== "OVERDUE" && !after.overdueNotifiedAt) {
      const { count } = await prisma.payment.updateMany({
        where: { id: after.id, overdueNotifiedAt: null },
        data: { overdueNotifiedAt: new Date() },
      });
      if (count) notifyStudents([paymentOverdueMessage(after)]);
    }
  } catch (error) {
    logger.error("Payment notification failed", { error });
  }
}

/** One pass: reminders for payments due within a day, then overdue marking. */
export async function checkPaymentDueDates(now = new Date()) {
  const due = await prisma.payment.findMany({
    where: {
      status: "PENDING",
      hasDueDate: true,
      reminderSentAt: null,
      dueDate: { gt: now, lte: new Date(now.getTime() + DAY) },
    },
    take: 500,
  });
  for (const p of due) {
    // Conditional update: a payment is reminded once even if two passes overlap.
    const { count } = await prisma.payment.updateMany({
      where: { id: p.id, reminderSentAt: null, status: "PENDING" },
      data: { reminderSentAt: now },
    });
    if (count) notifyStudents([paymentReminderMessage(p)]);
  }

  const late = await prisma.payment.findMany({
    where: { status: "PENDING", hasDueDate: true, overdueNotifiedAt: null, dueDate: { lte: now } },
    take: 500,
  });
  for (const p of late) {
    const { count } = await prisma.payment.updateMany({
      where: { id: p.id, status: "PENDING", overdueNotifiedAt: null },
      data: { status: "OVERDUE", overdueNotifiedAt: now },
    });
    if (count) notifyStudents([paymentOverdueMessage(p)]);
  }
  if (due.length || late.length) logger.info("Payment due dates checked", { reminded: due.length, overdue: late.length });
}

/** Runs the check every 30 minutes (first one a minute after start). */
export function startPaymentWatcher() {
  const run = () => checkPaymentDueDates().catch((error) => logger.error("Payment due check failed", { error }));
  const first = setTimeout(run, 60_000);
  const timer = setInterval(run, 30 * 60_000);
  first.unref();
  timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
