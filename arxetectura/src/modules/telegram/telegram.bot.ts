// src/modules/telegram/telegram.bot.ts — the student bot: takes the code a
// teacher gave, links the Telegram account, and opens the student Mini App.
//
// Production: webhook at {PUBLIC_APP_URL}/api/telegram/webhook (set on start).
// Local dev: long polling only with TELEGRAM_POLLING=1, and only with a
// separate test bot: polling removes the webhook of whatever bot the token is for.
import crypto from "node:crypto";
import { config } from "../../config.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { tg } from "./telegram.api.js";
import { looksLikeCode, normalizeCode, redeemLinkCode } from "./telegram.link.js";
import { receiveFromBot } from "../chat/chat.telegram.js";

let botUsername = config.telegram.botUsername;
export const getBotUsername = () => botUsername;

/** Telegram sends this back in a header on every webhook call. */
export const webhookSecret = () =>
  crypto.createHash("sha256").update(`webhook:${config.telegram.botToken}`).digest("hex").slice(0, 48);

const appUrl = () => (config.telegram.publicAppUrl.startsWith("https://") ? config.telegram.publicAppUrl : "");

// style "success" paints the button green (Bot API 9.4+; older apps show the default look).
export const openAppMarkup = () =>
  appUrl()
    ? { inline_keyboard: [[{ text: "🚀 Ilovani ochish", style: "success", web_app: { url: appUrl() } }]] }
    : undefined;

const send = (chatId: number, text: string, withAppButton = false) =>
  tg("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...(withAppButton && openAppMarkup() ? { reply_markup: openAppMarkup() } : {}),
  });

// The welcome banner (public/bot-banner.jpg). After the first upload Telegram
// gives a file_id, which is reused so the image isn't fetched again each time.
let bannerFileId = "";
const sendWithBanner = async (chatId: number, caption: string, withAppButton = false) => {
  const photo = bannerFileId || (appUrl() ? `${appUrl()}/bot-banner.jpg` : "");
  if (!photo) return send(chatId, caption, withAppButton);
  try {
    const sent = await tg<{ photo?: { file_id: string }[] }>("sendPhoto", {
      chat_id: chatId,
      photo,
      caption,
      parse_mode: "HTML",
      ...(withAppButton && openAppMarkup() ? { reply_markup: openAppMarkup() } : {}),
    });
    bannerFileId = sent.photo?.at(-1)?.file_id ?? bannerFileId;
  } catch {
    // Image unreachable (e.g. mid-deploy): the text alone still does the job.
    bannerFileId = "";
    await send(chatId, caption, withAppButton);
  }
};

export const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

// Wrong codes per Telegram user: 8 per 15 minutes (codes are 8 chars of 32 symbols).
const failures = new Map<number, { count: number; resetAt: number }>();
const FAIL_WINDOW = 15 * 60_000;
const tooManyFailures = (userId: number) => {
  const entry = failures.get(userId);
  return !!entry && entry.resetAt > Date.now() && entry.count >= 8;
};
const recordFailure = (userId: number) => {
  const now = Date.now();
  const entry = failures.get(userId);
  if (!entry || entry.resetAt <= now) failures.set(userId, { count: 1, resetAt: now + FAIL_WINDOW });
  else entry.count += 1;
};
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of failures) if (v.resetAt <= now) failures.delete(k);
}, 60_000).unref();

const ASK_CODE = [
  "👋 <b>Assalomu alaykum!</b>",
  "",
  "Bu — <b>Asmo Learning</b> o'quvchilar ilovasi: darslar, uyga vazifalar, testlar va coinlar bir joyda.",
  "",
  "<b>Qanday boshlash kerak:</b>",
  "1️⃣ Ustozingizdan <b>8 belgili kod</b> oling",
  "2️⃣ Kodni shu chatga yuboring, masalan: <code>ABCD-EFGH</code>",
  "3️⃣ <b>🚀 Ilovani ochish</b> tugmasini bosing",
  "",
  "🔒 Kod faqat siz uchun va bir marta ishlatiladi.",
].join("\n");

const sendLinked = (chatId: number, firstName: string) =>
  sendWithBanner(
    chatId,
    [
      `🎉 <b>Tabriklaymiz, ${escapeHtml(firstName)}!</b>`,
      "",
      "Hisobingiz shu Telegramga ulandi ✅",
      "",
      "Ilovani istalgan vaqtda oching:",
      "• pastdagi <b>🚀 Ilovani ochish</b> tugmasi",
      "• yoki chat menyusidagi <b>📚 Ilova</b> tugmasi",
      "",
      "💬 Ustozga savolingiz bo'lsa, shu chatga yozing — xabar ustozga boradi.",
    ].join("\n"),
    true,
  );

async function handleMessage(message: any) {
  const chatId: number = message.chat?.id;
  const from = message.from;
  if (!from || from.is_bot || message.chat?.type !== "private") return;
  const rawText = typeof message.text === "string" ? message.text.trim() : "";

  // A linked account (the student or a parent on the same Telegram): anything
  // that isn't a command goes to the teacher chat. A valid new link code still
  // re-links (e.g. the teacher made a fresh code for this phone).
  if (!rawText.startsWith("/")) {
    const linked = await prisma.user.findFirst({
      where: { telegramId: String(from.id), role: "STUDENT", status: "ACTIVE" },
      select: { id: true },
    });
    if (linked) {
      const code = normalizeCode(rawText);
      if (rawText && looksLikeCode(code)) {
        const student = await redeemLinkCode(code, { id: from.id, username: from.username });
        if (student) {
          logger.info("Telegram re-linked", { userId: student.id });
          return sendLinked(chatId, student.firstName);
        }
      }
      return receiveFromBot(linked.id, message);
    }
  }

  if (typeof message.text !== "string") return;
  const text = rawText;

  const isStart = /^\/start(\s|$)/.test(text);
  // "/start CODE" comes from a t.me/<bot>?start=CODE link.
  const payload = isStart ? text.slice(6).trim() : text.startsWith("/") ? "" : text;

  if (!payload) {
    const linked = await prisma.user.findFirst({
      where: { telegramId: String(from.id), role: "STUDENT", status: "ACTIVE" },
      select: { firstName: true },
    });
    if (linked)
      return sendWithBanner(
        chatId,
        `👋 Salom, <b>${escapeHtml(linked.firstName)}</b>!\n\nDarslar, vazifalar va testlaringiz sizni kutmoqda. Ilovani pastdagi tugma orqali oching 👇\n\n💬 Ustozga savol bo'lsa, shu chatga yozing.`,
        true,
      );
    return sendWithBanner(chatId, ASK_CODE);
  }

  if (tooManyFailures(from.id))
    return send(chatId, "⏳ Juda ko'p noto'g'ri urinish. 15 daqiqadan keyin qayta urinib ko'ring.");

  const code = normalizeCode(payload);
  const student = looksLikeCode(code) ? await redeemLinkCode(code, { id: from.id, username: from.username }) : null;
  if (!student) {
    recordFailure(from.id);
    return send(
      chatId,
      "😕 <b>Kod topilmadi</b>\n\nKod noto'g'ri yoki muddati o'tgan. Tekshirib qayta yuboring yoki ustozingizdan yangi kod so'rang.",
    );
  }
  failures.delete(from.id);
  logger.info("Telegram linked", { userId: student.id });
  await sendLinked(chatId, student.firstName);
  if (!appUrl()) logger.warn("PUBLIC_APP_URL is not an https URL; the bot cannot show the Mini App button");
}

/** Handles one Telegram update; never throws (a failing update must not block the others). */
export async function handleUpdate(update: any) {
  try {
    if (update?.message) await handleMessage(update.message);
  } catch (error) {
    logger.error("Telegram update failed", { error });
  }
}

async function configureBot() {
  const me = await tg<{ username: string }>("getMe");
  botUsername = me.username;
  await tg("setMyCommands", { commands: [{ command: "start", description: "🚀 Ilovani ochish / kod yuborish" }] });
  // Shown in an empty chat before "Start", and on the bot's profile.
  await tg("setMyDescription", {
    description:
      "📚 Asmo Learning — o'quvchilar ilovasi.\n\nDarslar, uyga vazifalar, testlar, coinlar va reyting — hammasi Telegram ichida.\n\n▶️ «Start» ni bosing va ustozingiz bergan kodni yuboring.",
  });
  await tg("setMyShortDescription", {
    short_description: "Asmo Learning o'quvchilar ilovasi: darslar, testlar, coinlar va reyting 📚",
  });
  if (appUrl())
    await tg("setChatMenuButton", { menu_button: { type: "web_app", text: "📚 Ilova", web_app: { url: appUrl() } } });
}

/** Starts the bot (webhook or opt-in polling). Returns a stop function. */
export function startTelegramBot(): () => void {
  if (!config.telegram.botToken) return () => undefined;
  const controller = new AbortController();

  (async () => {
    try {
      await configureBot();
      if (appUrl()) {
        await tg("setWebhook", {
          url: `${appUrl()}/api/telegram/webhook`,
          secret_token: webhookSecret(),
          allowed_updates: ["message"],
        });
        logger.info("Telegram bot ready (webhook)", { bot: botUsername });
        return;
      }
      if (process.env.TELEGRAM_POLLING !== "1") {
        logger.warn("Telegram bot: no https PUBLIC_APP_URL and TELEGRAM_POLLING is off; not receiving messages");
        return;
      }
      await tg("deleteWebhook", {});
      logger.info("Telegram bot ready (polling)", { bot: botUsername });
      let offset = 0;
      while (!controller.signal.aborted) {
        try {
          const updates = await tg<any[]>(
            "getUpdates",
            { offset, timeout: 25, allowed_updates: ["message"] },
            controller.signal,
          );
          for (const update of updates) {
            offset = update.update_id + 1;
            await handleUpdate(update);
          }
        } catch (error) {
          if (controller.signal.aborted) break;
          logger.warn("Telegram polling error", { error });
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    } catch (error) {
      logger.error("Telegram bot setup failed", { error });
    }
  })();

  return () => controller.abort();
}
