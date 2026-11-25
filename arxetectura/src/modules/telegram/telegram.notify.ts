// src/modules/telegram/telegram.notify.ts — messages to a student's linked
// Telegram: attendance, new homework, grades and payments (so the family
// sees them too). Fire-and-forget: a failed message never fails the request.
import { config } from "../../config.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { TelegramApiError, tg } from "./telegram.api.js";
import { escapeHtml, openAppMarkup } from "./telegram.bot.js";

export interface StudentMessage {
  studentId: string;
  text: string;
  /** Adds the green "open the app" button. */
  openApp?: boolean;
}

// Telegram allows ~30 messages/second per bot; one every 40 ms stays under it.
let queue: Promise<void> = Promise.resolve();
const enqueue = (job: () => Promise<unknown>) => {
  queue = queue
    .then(job)
    .catch((error) => {
      // 403: the student blocked the bot or never pressed Start. Nothing to do.
      if (!(error instanceof TelegramApiError && error.errorCode === 403))
        logger.warn("Telegram notification failed", { error });
    })
    .then(() => new Promise((r) => setTimeout(r, 40)));
};

/** Sends each message to its student's linked Telegram (students without one are skipped). */
export function notifyStudents(messages: StudentMessage[]) {
  if (!config.telegram.botToken || messages.length === 0) return;
  void (async () => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...new Set(messages.map((m) => m.studentId))] }, telegramId: { not: null }, status: "ACTIVE" },
      select: { id: true, telegramId: true },
    });
    const chats = new Map(users.map((u) => [u.id, u.telegramId!]));
    for (const message of messages) {
      const chatId = chats.get(message.studentId);
      if (!chatId) continue;
      const markup = message.openApp ? openAppMarkup() : undefined;
      enqueue(() =>
        tg("sendMessage", {
          chat_id: chatId,
          text: message.text,
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
          ...(markup ? { reply_markup: markup } : {}),
        }),
      );
    }
  })().catch((error) => logger.error("Telegram notification lookup failed", { error }));
}

// ---- Formatting -----------------------------------------------------------

const TZ = "Asia/Tashkent";
const dateFmt = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const fmtDate = (d: Date) => dateFmt.format(d);
const fmtDateTime = (d: Date) => dateTimeFmt.format(d).replace(",", "");
const money = (n: number) => `${new Intl.NumberFormat("ru-RU").format(n).replace(/ /g, " ")} so'm`;
const esc = (s: string | null | undefined) => escapeHtml(s ?? "");
const clip = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1)}…` : s);

const PAYMENT_TYPES: Record<string, string> = {
  CASH: "Naqd",
  CLICK: "Click",
  PAYME: "Payme",
  BANK: "Bank o'tkazmasi",
  UZUM: "Uzum",
};

type Student = { id: string; firstName: string; lastName: string };
const fullName = (s: Student) => esc(`${s.firstName} ${s.lastName}`.trim());

// ---- Messages ---------------------------------------------------------------

export const attendanceMessage = (
  student: Student,
  status: string,
  lesson: { topic: string; lessonDate: Date; groupName: string },
): StudentMessage => ({
  studentId: student.id,
  text: [
    status === "PRESENT"
      ? `✅ <b>Davomat:</b> ${fullName(student)} darsga <b>keldi</b>`
      : `❌ <b>Davomat:</b> ${fullName(student)} darsga <b>kelmadi</b>`,
    "",
    `👥 Guruh: ${esc(lesson.groupName)}`,
    `📖 Mavzu: ${esc(lesson.topic)}`,
    `📅 Sana: ${fmtDate(lesson.lessonDate)}`,
  ].join("\n"),
});

export const homeworkMessage = (
  studentId: string,
  homework: { title: string; description?: string | null; deadline: Date; maxScore: number },
  groupName: string,
): StudentMessage => ({
  studentId,
  openApp: true,
  text: [
    "📚 <b>Yangi uyga vazifa</b>",
    "",
    `📝 <b>${esc(homework.title)}</b>`,
    ...(homework.description ? [esc(clip(homework.description, 400))] : []),
    "",
    `👥 Guruh: ${esc(groupName)}`,
    `⏳ Muddat: <b>${fmtDateTime(homework.deadline)}</b>`,
    `⭐ Maksimal ball: ${homework.maxScore}`,
  ].join("\n"),
});

export const gradeMessage = (
  studentId: string,
  homeworkTitle: string,
  score: number,
  maxScore: number,
  feedback?: string | null,
): StudentMessage => {
  const pct = maxScore > 0 ? score / maxScore : 0;
  const medal = pct >= 0.9 ? "🏆" : pct >= 0.7 ? "🌟" : pct >= 0.5 ? "👍" : "📌";
  return {
    studentId,
    openApp: true,
    text: [
      "⭐ <b>Uyga vazifa baholandi</b>",
      "",
      `📝 ${esc(homeworkTitle)}`,
      `${medal} Baho: <b>${score} / ${maxScore}</b>`,
      ...(feedback ? [`💬 Ustoz izohi: ${esc(clip(feedback, 500))}`] : []),
    ].join("\n"),
  };
};

type PaymentLike = {
  studentId: string;
  amountNumber: number;
  amount: number;
  paymentType: string;
  description: string | null;
  dueDate: Date;
  paidAt: Date | null;
};
const amountOf = (p: PaymentLike) => p.amountNumber || p.amount;

export const paymentPaidMessage = (p: PaymentLike): StudentMessage => ({
  studentId: p.studentId,
  text: [
    "✅ <b>To'lov qabul qilindi</b>",
    "",
    `💰 Summa: <b>${money(amountOf(p))}</b>`,
    `💳 Turi: ${PAYMENT_TYPES[p.paymentType] ?? esc(p.paymentType)}`,
    ...(p.description ? [`🧾 Izoh: ${esc(p.description)}`] : []),
    `📅 Sana: ${fmtDateTime(p.paidAt ?? new Date())}`,
    "",
    "Rahmat! 🙏",
  ].join("\n"),
});

export const paymentReminderMessage = (p: PaymentLike): StudentMessage => ({
  studentId: p.studentId,
  text: [
    "🔔 <b>To'lov muddati yaqinlashmoqda</b>",
    "",
    `💰 Summa: <b>${money(amountOf(p))}</b>`,
    ...(p.description ? [`🧾 ${esc(p.description)}`] : []),
    `📅 Muddat: <b>${fmtDate(p.dueDate)}</b>`,
    "",
    "Iltimos, to'lovni o'z vaqtida amalga oshiring.",
  ].join("\n"),
});

export const paymentOverdueMessage = (p: PaymentLike): StudentMessage => ({
  studentId: p.studentId,
  text: [
    "⚠️ <b>To'lov muddati o'tdi</b>",
    "",
    `💰 Summa: <b>${money(amountOf(p))}</b>`,
    ...(p.description ? [`🧾 ${esc(p.description)}`] : []),
    `📅 Muddat: ${fmtDate(p.dueDate)} edi`,
    "",
    "Iltimos, to'lovni imkon qadar tezroq amalga oshiring.",
  ].join("\n"),
});

/** Attendance marks for one lesson → one message per student. */
export async function notifyAttendance(lessonId: string, marks: { studentId: string; status: string }[]) {
  if (!config.telegram.botToken || marks.length === 0) return;
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { topic: true, lessonDate: true, Group: { select: { name: true } } },
    });
    if (!lesson) return;
    const students = await prisma.user.findMany({
      where: { id: { in: marks.map((m) => m.studentId) }, telegramId: { not: null } },
      select: { id: true, firstName: true, lastName: true },
    });
    const byId = new Map(students.map((s) => [s.id, s]));
    notifyStudents(
      marks.flatMap((m) => {
        const student = byId.get(m.studentId);
        return student
          ? [attendanceMessage(student, m.status, { topic: lesson.topic, lessonDate: lesson.lessonDate, groupName: lesson.Group.name })]
          : [];
      }),
    );
  } catch (error) {
    logger.error("Attendance notification failed", { error });
  }
}
