// src/modules/teacherPanel/teacherChat.routes.ts — teacher ↔ family chat.
// One thread per student (the student's linked Telegram is shared with the
// parents). Staff see the threads of students in their scope; incoming
// messages count as read once any staff member opens the thread.
import { Readable } from "node:stream";
import express, { Router } from "express";
import { z } from "zod";
import { config } from "../../config.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { assertStudent, studentScope, uid } from "../../utils/teacherScope.js";
import { TelegramApiError, tg, tgFileUrl } from "../telegram/telegram.api.js";
import { MAX_CAPTION, MAX_CHAT_TEXT, sendMediaToFamily, sendToFamily } from "../chat/chat.telegram.js";
import { MediaFormatError, prepareForTelegram } from "../chat/chat.media.js";
import { nudgeArchiver } from "../chat/chat.archive.js";

export const teacherChatRouter = Router();
const staff = [requireAuth, requireRole("TEACHER", "ADMIN")];

// GET requests carry no body: it defaults to {} (same as the shared idSchema).
const noBody = z.record(z.string(), z.unknown()).default({});

const toMessage = (m: {
  id: string;
  fromStudent: boolean;
  senderName: string | null;
  kind: string;
  text: string;
  fileId: string | null;
  duration: number | null;
  createdAt: Date;
}) => ({
  id: m.id,
  fromStudent: m.fromStudent,
  senderName: m.senderName,
  kind: m.kind,
  text: m.text,
  hasFile: Boolean(m.fileId),
  duration: m.duration,
  createdAt: m.createdAt,
});

/** Thread list: latest message per student + unread counts, newest first. */
teacherChatRouter.get(
  "/teacher/chats",
  ...staff,
  asyncRoute(async (req: any, res: any) => {
    const studentWhere = { role: "STUDENT", ...(await studentScope(req)) };
    const [latest, unread] = await Promise.all([
      prisma.chatMessage.findMany({
        where: { Student: studentWhere },
        orderBy: { createdAt: "desc" },
        distinct: ["studentId"],
        take: 300,
        include: { Student: { select: { id: true, firstName: true, lastName: true, avatar: true, telegramId: true } } },
      }),
      prisma.chatMessage.groupBy({
        by: ["studentId"],
        where: { fromStudent: true, isRead: false, Student: studentWhere },
        _count: { _all: true },
      }),
    ]);
    const unreadOf = new Map(unread.map((u) => [u.studentId, u._count._all]));
    res.json(
      latest.map((m) => ({
        student: {
          id: m.Student.id,
          firstName: m.Student.firstName,
          lastName: m.Student.lastName,
          avatar: m.Student.avatar,
          telegramLinked: Boolean(m.Student.telegramId),
        },
        last: toMessage(m),
        unread: unreadOf.get(m.studentId) ?? 0,
      })),
    );
  }),
);

/** Unread incoming messages across the caller's students (nav badge). */
teacherChatRouter.get(
  "/teacher/chats/unread",
  ...staff,
  asyncRoute(async (req: any, res: any) => {
    const count = await prisma.chatMessage.count({
      where: { fromStudent: true, isRead: false, Student: { role: "STUDENT", ...(await studentScope(req)) } },
    });
    res.json({ count });
  }),
);

const studentParam = z.object({ studentId: z.string().min(1) });

/** One thread (latest 300 messages, oldest first); marks incoming ones read. */
teacherChatRouter.get(
  "/teacher/chats/:studentId",
  ...staff,
  validate(z.object({ body: noBody, params: studentParam, query: z.object({}).passthrough() })),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.studentId);
    const [messages, groups] = await Promise.all([
      prisma.chatMessage.findMany({ where: { studentId: student.id }, orderBy: { createdAt: "desc" }, take: 300 }),
      prisma.group.findMany({
        where: { Enrollment: { some: { studentId: student.id, status: { not: "DROPPED" } } } },
        select: { id: true, name: true },
      }),
    ]);
    await prisma.chatMessage.updateMany({
      where: { studentId: student.id, fromStudent: true, isRead: false },
      data: { isRead: true },
    });
    res.json({
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        avatar: student.avatar,
        telegramLinked: Boolean(student.telegramId),
        telegramUsername: student.telegramUsername,
        groups,
      },
      botEnabled: Boolean(config.telegram.botToken),
      messages: messages.reverse().map(toMessage),
    });
  }),
);

/** Bot configured + student linked, or an error response already sent (returns null). */
const deliverable = (student: { telegramId: string | null }, res: any) => {
  if (!config.telegram.botToken) {
    res.status(503).json({ error: "Telegram bot is not configured", code: "BOT_DISABLED" });
    return null;
  }
  if (!student.telegramId) {
    res.status(409).json({ error: "Student has no linked Telegram", code: "NOT_LINKED" });
    return null;
  }
  return student.telegramId;
};

const staffName = async (req: any) => {
  const me = await prisma.user.findUnique({ where: { id: uid(req) }, select: { firstName: true, lastName: true } });
  return me ? `${me.firstName} ${me.lastName}`.trim() : "Ustoz";
};

/** Telegram refused delivery: answer with a code the panel can explain. */
const telegramFailed = (error: unknown, res: any) => {
  if (error instanceof TelegramApiError && (error.errorCode === 403 || error.errorCode === 400)) {
    logger.warn("Chat delivery refused by Telegram", { description: error.description });
    return res.status(409).json({ error: "The student's Telegram can't receive this message", code: "BLOCKED" });
  }
  logger.warn("Chat message to Telegram failed", { error });
  return res.status(502).json({ error: "Telegram did not accept the message", code: "TELEGRAM_FAILED" });
};

/** Staff reply: delivered through the bot first, saved only if Telegram took it. */
teacherChatRouter.post(
  "/teacher/chats/:studentId",
  ...staff,
  validate(
    z.object({
      body: z.object({ text: z.string().trim().min(1).max(MAX_CHAT_TEXT) }),
      params: studentParam,
      query: z.object({}).passthrough(),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.studentId);
    const telegramId = deliverable(student, res);
    if (!telegramId) return;
    const senderName = await staffName(req);
    try {
      await sendToFamily(telegramId, senderName, req.body.text);
    } catch (error) {
      return telegramFailed(error, res);
    }
    const message = await prisma.chatMessage.create({
      data: { id: newId(), studentId: student.id, fromStudent: false, senderName, text: req.body.text, isRead: true },
    });
    nudgeArchiver();
    res.status(201).json(toMessage(message));
  }),
);

/**
 * Staff media reply (photo / voice / round video). The raw file is the request
 * body (its Content-Type says what it is); `kind` and `caption` come in the
 * query. Sent to Telegram first; only the returned file_id is stored.
 */
teacherChatRouter.post(
  "/teacher/chats/:studentId/media",
  ...staff,
  express.raw({ type: () => true, limit: "20mb" }),
  validate(
    z.object({
      body: z.any(),
      params: studentParam,
      query: z.object({
        kind: z.enum(["photo", "voice", "video_note"]),
        caption: z.string().trim().max(MAX_CAPTION).optional(),
      }),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.studentId);
    const telegramId = deliverable(student, res);
    if (!telegramId) return;
    const data: unknown = req.body;
    if (!Buffer.isBuffer(data) || data.length === 0) return res.status(400).json({ error: "Empty file" });
    const kind = req.query.kind as "photo" | "voice" | "video_note";
    const caption = kind === "video_note" ? "" : String(req.query.caption ?? "").trim();

    let file;
    try {
      file = await prepareForTelegram(kind, data, String(req.get("content-type") ?? ""));
    } catch (error) {
      if (error instanceof MediaFormatError)
        return res.status(415).json({ error: error.message, code: "UNSUPPORTED_FORMAT" });
      throw error;
    }
    const senderName = await staffName(req);
    let sent;
    try {
      sent = await sendMediaToFamily(telegramId, senderName, kind, file, caption);
    } catch (error) {
      return telegramFailed(error, res);
    }
    const message = await prisma.chatMessage.create({
      data: {
        id: newId(),
        studentId: student.id,
        fromStudent: false,
        senderName,
        kind,
        text: caption,
        fileId: sent.fileId,
        duration: sent.duration,
        isRead: true,
      },
    });
    nudgeArchiver();
    res.status(201).json(toMessage(message));
  }),
);

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  oga: "audio/ogg",
  ogg: "audio/ogg",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  mov: "video/quicktime",
};
const FALLBACK_TYPE: Record<string, string> = {
  photo: "image/jpeg",
  voice: "audio/ogg",
  video_note: "video/mp4",
  video: "video/mp4",
};

/**
 * A message's photo / voice / video, streamed from Telegram's storage (the
 * download URL holds the bot token, so it never reaches the browser). Bots can
 * download files up to 20 MB.
 */
teacherChatRouter.get(
  "/teacher/chats/:studentId/file/:messageId",
  ...staff,
  validate(
    z.object({
      body: noBody,
      params: studentParam.extend({ messageId: z.string().min(1) }),
      query: z.object({}).passthrough(),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.studentId);
    const message = await prisma.chatMessage.findFirst({
      where: { id: req.params.messageId, studentId: student.id, fileId: { not: null } },
      select: { fileId: true, archiveFileId: true, kind: true },
    });
    if (!message?.fileId || !config.telegram.botToken) return res.status(404).json({ error: "Not found" });
    // The original first; if it's gone (the family deleted the chat), the archive channel's copy.
    let filePath: string | undefined;
    for (const fileId of [message.fileId, message.archiveFileId]) {
      if (!fileId) continue;
      try {
        filePath = (await tg<{ file_path?: string }>("getFile", { file_id: fileId })).file_path;
        if (filePath) break;
      } catch (error) {
        // "file is too big" (over 20 MB) or an expired id: try the next copy.
        if (!(error instanceof TelegramApiError)) throw error;
      }
    }
    if (!filePath) return res.status(404).json({ error: "File unavailable", code: "FILE_UNAVAILABLE" });
    const upstream = await fetch(tgFileUrl(filePath));
    if (!upstream.ok || !upstream.body) return res.status(502).json({ error: "Telegram file unavailable" });
    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    res.setHeader("Content-Type", CONTENT_TYPES[ext] ?? FALLBACK_TYPE[message.kind] ?? "application/octet-stream");
    const length = upstream.headers.get("content-length");
    if (length) res.setHeader("Content-Length", length);
    res.setHeader("Cache-Control", "private, max-age=86400");
    Readable.fromWeb(upstream.body as any).pipe(res);
  }),
);
