// src/modules/telegram/telegram.api.ts — tiny Telegram Bot API client (fetch, no SDK).
import { config } from "../../config.js";

export class TelegramApiError extends Error {
  constructor(
    public method: string,
    public description: string,
    public errorCode?: number,
    /** 429 Too Many Requests: seconds to wait before retrying. */
    public retryAfter?: number,
  ) {
    super(`Telegram ${method} failed: ${description}`);
  }
}

// Overridable only for local tests (a fake Telegram server).
const API_BASE = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/+$/, "");

async function parse<T>(method: string, res: Response): Promise<T> {
  const data = (await res.json().catch(() => null)) as {
    ok: boolean;
    result: T;
    description?: string;
    error_code?: number;
    parameters?: { retry_after?: number };
  } | null;
  if (!data?.ok)
    throw new TelegramApiError(
      method,
      data?.description ?? `HTTP ${res.status}`,
      data?.error_code,
      data?.parameters?.retry_after,
    );
  return data.result;
}

export async function tg<T = any>(method: string, params: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}/bot${config.telegram.botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });
  return parse<T>(method, res);
}

/** Multipart call that uploads one file (sendPhoto, sendVoice, sendVideoNote…). */
export async function tgUpload<T = any>(
  method: string,
  fields: Record<string, string | number | undefined>,
  file: { field: string; data: Buffer; filename: string; type: string },
): Promise<T> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) if (value !== undefined) form.append(key, String(value));
  form.append(file.field, new Blob([new Uint8Array(file.data)], { type: file.type }), file.filename);
  const res = await fetch(`${API_BASE}/bot${config.telegram.botToken}/${method}`, { method: "POST", body: form });
  return parse<T>(method, res);
}

/** Download URL of a file from getFile (contains the bot token: server-side only). */
export const tgFileUrl = (filePath: string) => `${API_BASE}/file/bot${config.telegram.botToken}/${filePath}`;
