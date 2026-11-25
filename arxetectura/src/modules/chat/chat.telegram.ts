// src/modules/chat/chat.telegram.ts — the Telegram side of the teacher ↔ family
// chat. The student and their parents share the student's linked Telegram
// account, so anything that account writes to the bot (that isn't a command)
// lands in that student's thread in the teacher panel; staff replies are
// delivered back through the bot.
//
// Telegram is the file storage: for photos, voice messages and videos only the
// Telegram file_id is saved; the server fetches the file when someone views it.
import { prisma } from "../../lib/prisma.js";
import { newId } from "../../utils/ids.js";
import { tg, tgUpload } from "../telegram/telegram.api.js";
import { nudgeArchiver } from "./chat.archive.js";

const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/** Telegram's limits are 4096 (text) and 1024 (caption); keep room for the header line. */
export const MAX_CHAT_TEXT = 3500;
export const MAX_CAPTION = 900;

export type ChatKind = "text" | "photo" | "voice" | "video_note" | "video";

/** What an incoming Telegram message carries, or null when it's a kind we don't take. */
const incomingMedia = (message: any): { kind: ChatKind; fileId: string | null; duration: number | null } | null => {
  if (message.photo?.length) return { kind: "photo", fileId: message.photo.at(-1).file_id, duration: null };
  if (message.voice) return { kind: "voice", fileId: message.voice.file_id, duration: message.voice.duration ?? null };
  if (message.video_note)
    return { kind: "video_note", fileId: message.video_note.file_id, duration: message.video_note.duration ?? null };
  if (message.video) return { kind: "video", fileId: message.video.file_id, duration: message.video.duration ?? null };
  if (typeof message.text === "string") return { kind: "text", fileId: null, duration: null };
  return null;
};

// A short "sent to the teacher" note, at most once per half hour per thread,
// so a family writing several messages in a row isn't answered every time.
const RECEIPT_GAP = 30 * 60_000;

/** Saves a message the student's Telegram account sent to the bot. */
export async function receiveFromBot(studentId: string, message: any) {
  const chatId: number = message.chat.id;
  const media = incomingMedia(message);
  const text = String(message.text ?? message.caption ?? "").trim().slice(0, MAX_CHAT_TEXT);

  if (!media || (media.kind === "text" && !text)) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: "ℹ️ Ustozga <b>matn</b>, <b>rasm</b>, <b>ovozli xabar</b> yoki <b>video</b> yuborish mumkin.",
      parse_mode: "HTML",
    });
    return;
  }

  const recent = await prisma.chatMessage.findFirst({
    where: { studentId, fromStudent: true, createdAt: { gt: new Date(Date.now() - RECEIPT_GAP) } },
    select: { id: true },
  });
  await prisma.chatMessage.create({
    data: { id: newId(), studentId, fromStudent: true, kind: media.kind, text, fileId: media.fileId, duration: media.duration },
  });
  nudgeArchiver();

  // Quiet receipt on the message itself; older Telegram apps may not support it.
  await tg("setMessageReaction", {
    chat_id: chatId,
    message_id: message.message_id,
    reaction: [{ type: "emoji", emoji: "👌" }],
  }).catch(() => {});
  if (!recent)
    await tg("sendMessage", {
      chat_id: chatId,
      text: "✅ Xabaringiz ustozga yuborildi. Javob shu chatga keladi.",
    });
}

const header = (senderName: string) => `💬 <b>${escapeHtml(senderName)}</b> (ustoz)`;

/** Delivers a staff text reply to the student's Telegram (throws TelegramApiError on failure). */
export const sendToFamily = (telegramId: string, senderName: string, text: string) =>
  tg("sendMessage", {
    chat_id: telegramId,
    text: `${header(senderName)}:\n\n${escapeHtml(text)}`,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
  });

export interface OutgoingFile {
  data: Buffer;
  filename: string;
  type: string;
}

/**
 * Delivers a staff photo / voice / round video. Returns the Telegram file_id
 * (what gets saved) and the duration Telegram reports.
 */
export async function sendMediaToFamily(
  telegramId: string,
  senderName: string,
  kind: Exclude<ChatKind, "text" | "video">,
  file: OutgoingFile,
  caption: string,
): Promise<{ fileId: string; duration: number | null }> {
  const captionHtml = caption ? `${header(senderName)}:\n\n${escapeHtml(caption)}` : header(senderName);
  if (kind === "photo") {
    const sent = await tgUpload<{ photo: { file_id: string }[] }>(
      "sendPhoto",
      { chat_id: telegramId, caption: captionHtml, parse_mode: "HTML" },
      { field: "photo", ...file },
    );
    return { fileId: sent.photo.at(-1)!.file_id, duration: null };
  }
  if (kind === "voice") {
    const sent = await tgUpload<{ voice: { file_id: string; duration?: number } }>(
      "sendVoice",
      { chat_id: telegramId, caption: captionHtml, parse_mode: "HTML" },
      { field: "voice", ...file },
    );
    return { fileId: sent.voice.file_id, duration: sent.voice.duration ?? null };
  }
  // Round videos can't carry a caption: the sender line goes just before.
  await tg("sendMessage", { chat_id: telegramId, text: `${header(senderName)}:`, parse_mode: "HTML" });
  const sent = await tgUpload<{ video_note: { file_id: string; duration?: number } }>(
    "sendVideoNote",
    { chat_id: telegramId },
    { field: "video_note", ...file },
  );
  return { fileId: sent.video_note.file_id, duration: sent.video_note.duration ?? null };
}
