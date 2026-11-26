// src/modules/files/files.store.ts — the Telegram archive channel as file
// storage for students' homework attachments and profile photos.
// A file sent as a data: URL is uploaded to the channel (as a document, so it
// keeps its quality), only Telegram's file_id is saved, and the app keeps a
// short link instead: /api/files/<random id>.<ext>. Without a bot token or an
// archive channel nothing changes: the data: URL is kept as before.
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { Router } from "express";
import { config } from "../../config.js";
import { logger } from "../../lib/logger.js";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute } from "../../middleware/index.js";
import { TelegramApiError, tg, tgFileUrl, tgUpload } from "../telegram/telegram.api.js";

export type StoredKind = "homework" | "avatar";

/** Links this module hands out (also accepted back by the validators). */
export const STORED_LINK = /^\/api\/files\/[a-f0-9]{32}(\.[a-z0-9]{1,8})?$/;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "application/pdf": "pdf",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/zip": "zip",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "video/mp4": "mp4",
};

export const telegramStorageOn = () => Boolean(config.telegram.botToken && config.telegram.archiveChatId);

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * A data: URL → uploaded to the archive channel → "/api/files/<id>.<ext>".
 * Anything that isn't a data: URL (or with Telegram storage off) is returned as is.
 * Throws when Telegram refuses the upload (the caller answers with an error).
 */
export async function storeDataUrl(
  value: string,
  opts: { kind: StoredKind; ownerId: string; caption: string; name?: string },
): Promise<string> {
  if (!value.startsWith("data:") || !telegramStorageOn()) return value;
  const match = /^data:([\w.+-]+\/[\w.+-]+)?(;[^,]*)?;base64,(.*)$/s.exec(value);
  if (!match) return value;
  const mime = (match[1] ?? "application/octet-stream").toLowerCase();
  const data = Buffer.from(match[3] ?? "", "base64");
  const ext = EXT[mime] ?? "bin";
  const id = crypto.randomBytes(16).toString("hex");
  const filename = opts.name?.replace(/[^\w.\- ]+/g, "_").slice(0, 80) || `${opts.kind}-${id.slice(0, 8)}.${ext}`;

  const sent = await tgUpload<{ document?: { file_id: string }; photo?: { file_id: string }[] }>(
    "sendDocument",
    {
      chat_id: config.telegram.archiveChatId,
      caption: opts.caption.slice(0, 1000),
      parse_mode: "HTML",
      disable_content_type_detection: "true",
    },
    { field: "document", data, filename, type: mime },
  );
  const fileId = sent.document?.file_id ?? sent.photo?.at(-1)?.file_id;
  if (!fileId) throw new Error("Telegram returned no file");

  await prisma.storedFile.create({
    data: { id, fileId, kind: opts.kind, ownerId: opts.ownerId, mime, name: opts.name ?? null, size: data.length },
  });
  return `/api/files/${id}.${ext}`;
}

/** Caption for the archive channel: what it is and whose. */
export const fileCaption = (title: string, lines: (string | null | undefined)[]) =>
  [`<b>${escapeHtml(title)}</b>`, ...lines.filter(Boolean).map((l) => escapeHtml(l!))].join("\n");

// ── Serving ──

// Telegram's download paths stay valid for at least an hour.
const PATH_TTL_MS = 50 * 60_000;
const paths = new Map<string, { path: string; at: number }>();

const filePath = async (fileId: string) => {
  const hit = paths.get(fileId);
  if (hit && Date.now() - hit.at < PATH_TTL_MS) return hit.path;
  const path = (await tg<{ file_path?: string }>("getFile", { file_id: fileId })).file_path;
  if (!path) return undefined;
  if (paths.size >= 2000) paths.delete(paths.keys().next().value!);
  paths.set(fileId, { path, at: Date.now() });
  return path;
};

export const filesRouter = Router();

/**
 * The file behind a stored link. No login: the random id is the permission
 * (it only appears where the owner / their teachers can see it), which lets
 * plain <img src> tags show avatars. Files never change, so browsers and the
 * edge cache keep them for a year.
 */
filesRouter.get(
  "/files/:name",
  asyncRoute(async (req: any, res: any) => {
    const id = String(req.params.name).split(".")[0] ?? "";
    if (!/^[a-f0-9]{32}$/.test(id)) return res.status(404).json({ error: "Not found" });
    const file = await prisma.storedFile.findUnique({ where: { id } });
    if (!file || !config.telegram.botToken) return res.status(404).json({ error: "Not found" });

    let path: string | undefined;
    try {
      path = await filePath(file.fileId);
    } catch (error) {
      if (!(error instanceof TelegramApiError)) throw error;
      logger.warn("Stored file unavailable on Telegram", { id, description: error.description });
    }
    if (!path) return res.status(404).json({ error: "File unavailable" });

    const upstream = await fetch(tgFileUrl(path));
    if (!upstream.ok || !upstream.body) {
      paths.delete(file.fileId);
      return res.status(502).json({ error: "Telegram file unavailable" });
    }
    res.setHeader("Content-Type", file.mime);
    const length = upstream.headers.get("content-length");
    if (length) res.setHeader("Content-Length", length);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Images / PDFs open in the browser; anything else downloads under its name.
    const inline = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mime);
    const fname = (file.name ?? `file.${String(req.params.name).split(".")[1] ?? "bin"}`).replace(/["\\\r\n]/g, "_");
    res.setHeader(
      "Content-Disposition",
      `${inline ? "inline" : "attachment"}; filename="${fname.replace(/[^\x20-\x7e]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(fname)}`,
    );
    Readable.fromWeb(upstream.body as any).pipe(res);
  }),
);
