// src/modules/chat/chat.archive.ts — copies every chat message (text, photo,
// voice, video, round video) into a private Telegram channel, the archive
// (TELEGRAM_ARCHIVE_CHAT_ID, the bot is its admin).
//
// Why: files stay on Telegram instead of our server. The channel copy keeps a
// file alive even if the family deletes their chat with the bot, and staff can
// read the whole history there. The panel falls back to the copy's file_id.
//
// How: a sweeper posts the not-yet-archived rows, oldest first, about one every
// 3 s (Telegram allows ~20 posts a minute in one channel). Nothing is lost on a
// restart, and messages from before the archive was set up are copied too.
import { config } from "../../config.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { TelegramApiError, tg } from "../telegram/telegram.api.js";

const BATCH = 15;
const GAP_MS = 3200;
const SWEEP_MS = 60_000;

const escapeHtml = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
const when = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Asia/Tashkent",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

// Which Bot API method re-posts each kind by file_id, and where the file sits in the result.
const SEND: Record<string, { method: string; field: string; fileId: (m: any) => string | undefined }> = {
  photo: { method: "sendPhoto", field: "photo", fileId: (m) => m.photo?.at(-1)?.file_id },
  voice: { method: "sendVoice", field: "voice", fileId: (m) => m.voice?.file_id },
  video: { method: "sendVideo", field: "video", fileId: (m) => m.video?.file_id },
  video_note: { method: "sendVideoNote", field: "video_note", fileId: (m) => m.video_note?.file_id },
};

type Row = Awaited<ReturnType<typeof nextBatch>>[number];

const nextBatch = () =>
  prisma.chatMessage.findMany({
    where: { archivedAt: null },
    orderBy: { createdAt: "asc" },
    take: BATCH,
    include: { Student: { select: { firstName: true, lastName: true } } },
  });

/** "👨‍👩‍👦 Ali Valiyev → ustoz · 25.11.2026, 14:05" (+ the text). Captions max 1024. */
const describe = (row: Row, limit: number) => {
  const student = `${row.Student.firstName} ${row.Student.lastName}`;
  const who = row.fromStudent
    ? `👨‍👩‍👦 <b>${escapeHtml(student)}</b> → ustoz`
    : `🧑‍🏫 <b>${escapeHtml(row.senderName ?? "Ustoz")}</b> → ${escapeHtml(student)}`;
  const head = `${who}\n🕒 ${when.format(row.createdAt)}`;
  if (!row.text) return head;
  const room = limit - head.length - 4;
  const text = row.text.length > room ? `${row.text.slice(0, room - 1)}…` : row.text;
  return `${head}\n\n${escapeHtml(text)}`;
};

async function archiveOne(row: Row, chatId: string) {
  if (row.kind === "text" || !row.fileId) {
    const sent = await tg<{ message_id: number }>("sendMessage", {
      chat_id: chatId,
      text: describe(row, 4000),
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
    });
    return { archiveMessageId: sent.message_id, archiveFileId: null };
  }
  const how = SEND[row.kind];
  if (!how) return { archiveMessageId: null, archiveFileId: null };
  // Round videos take no caption: the description goes in a reply under it.
  const withCaption = row.kind !== "video_note";
  const sent = await tg<any>(how.method, {
    chat_id: chatId,
    [how.field]: row.fileId,
    ...(withCaption ? { caption: describe(row, 1000), parse_mode: "HTML" } : {}),
  });
  if (!withCaption)
    await tg("sendMessage", {
      chat_id: chatId,
      text: describe(row, 4000),
      parse_mode: "HTML",
      reply_parameters: { message_id: sent.message_id },
    });
  return { archiveMessageId: sent.message_id as number, archiveFileId: how.fileId(sent) ?? null };
}

/** The channel itself is the problem (bot not admin, wrong id): retry later, don't skip rows. */
const channelProblem = (error: TelegramApiError) =>
  error.errorCode === 403 || /chat not found|not enough rights|need administrator|chat_admin_required/i.test(error.description);

let running = false;
let warned = false;

async function sweep() {
  const chatId = config.telegram.archiveChatId;
  if (running || !chatId || !config.telegram.botToken) return;
  running = true;
  try {
    for (const row of await nextBatch()) {
      try {
        const copy = await archiveOne(row, chatId);
        await prisma.chatMessage.update({ where: { id: row.id }, data: { ...copy, archivedAt: new Date() } });
        warned = false;
      } catch (error) {
        if (!(error instanceof TelegramApiError)) throw error;
        if (error.errorCode === 429) {
          // Too fast for the channel: wait it out, the next sweep continues.
          await new Promise((r) => setTimeout(r, Math.min(60, error.retryAfter ?? 10) * 1000));
          break;
        }
        if (channelProblem(error)) {
          if (!warned) logger.warn("Chat archive channel unavailable", { description: error.description });
          warned = true;
          break;
        }
        // This one message can't be copied (e.g. its file expired): mark it and move on.
        logger.warn("Chat message not archived", { id: row.id, description: error.description });
        await prisma.chatMessage.update({ where: { id: row.id }, data: { archivedAt: new Date() } });
      }
      await new Promise((r) => setTimeout(r, GAP_MS));
    }
  } catch (error) {
    logger.error("Chat archive sweep failed", { error });
  } finally {
    running = false;
  }
}

let nudge: NodeJS.Timeout | null = null;
/** A new message was saved: archive it soon instead of waiting for the next sweep. */
export function nudgeArchiver() {
  if (!config.telegram.archiveChatId || nudge) return;
  nudge = setTimeout(() => {
    nudge = null;
    void sweep();
  }, 3000);
  nudge.unref();
}

/** Checks the channel once, then sweeps every minute. Returns a stop function. */
export function startChatArchiver() {
  const chatId = config.telegram.archiveChatId;
  if (!chatId || !config.telegram.botToken) return () => undefined;
  void (async () => {
    try {
      const [chat, me] = await Promise.all([
        tg<{ title?: string }>("getChat", { chat_id: chatId }),
        tg<{ id: number }>("getMe"),
      ]);
      const member = await tg<{ status: string; can_post_messages?: boolean }>("getChatMember", {
        chat_id: chatId,
        user_id: me.id,
      });
      if (member.status !== "administrator" || member.can_post_messages === false)
        logger.warn("Chat archive: the bot must be an admin that can post in the channel", {
          title: chat.title,
          status: member.status,
        });
      else logger.info("Chat archive ready", { title: chat.title });
    } catch (error) {
      logger.warn("Chat archive channel check failed (check TELEGRAM_ARCHIVE_CHAT_ID)", { error });
    }
  })();
  const first = setTimeout(() => void sweep(), 10_000);
  const timer = setInterval(() => void sweep(), SWEEP_MS);
  first.unref();
  timer.unref();
  return () => {
    clearTimeout(first);
    clearInterval(timer);
  };
}
