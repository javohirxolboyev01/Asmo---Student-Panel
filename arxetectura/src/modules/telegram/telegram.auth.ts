// src/modules/telegram/telegram.auth.ts — verifies Mini App launch data.
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import crypto from "node:crypto";
import { config } from "../../config.js";

/** initData older than this is refused (Telegram issues a fresh one on every launch). */
const MAX_AGE_SECONDS = 24 * 60 * 60;

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

/** Returns the Telegram user if `initData` was signed with our bot token, else null. */
export function verifyInitData(initData: string): TelegramUser | null {
  if (!config.telegram.botToken || !initData || initData.length > 4096) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(config.telegram.botToken).digest();
  const expected = crypto.createHmac("sha256", secret).update(dataCheckString).digest();
  if (!crypto.timingSafeEqual(expected, Buffer.from(hash, "hex"))) return null;

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;
  try {
    const user = JSON.parse(params.get("user") ?? "null") as TelegramUser | null;
    return user && Number.isSafeInteger(user.id) ? user : null;
  } catch {
    return null;
  }
}
