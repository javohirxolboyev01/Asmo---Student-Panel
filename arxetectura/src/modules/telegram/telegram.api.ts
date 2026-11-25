// src/modules/telegram/telegram.api.ts — tiny Telegram Bot API client (fetch, no SDK).
import { config } from "../../config.js";

export class TelegramApiError extends Error {
  constructor(public method: string, public description: string, public errorCode?: number) {
    super(`Telegram ${method} failed: ${description}`);
  }
}

// Overridable only for local tests (a fake Telegram server).
const API_BASE = (process.env.TELEGRAM_API_BASE || "https://api.telegram.org").replace(/\/+$/, "");

export async function tg<T = any>(method: string, params: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}/bot${config.telegram.botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal,
  });
  const data = (await res.json().catch(() => null)) as { ok: boolean; result: T; description?: string; error_code?: number } | null;
  if (!data?.ok) throw new TelegramApiError(method, data?.description ?? `HTTP ${res.status}`, data?.error_code);
  return data.result;
}
