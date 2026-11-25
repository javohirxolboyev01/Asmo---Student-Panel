// src/config.ts — centralised, typed access to environment configuration.
const isProduction = process.env.NODE_ENV === "production";
const DEV_JWT_SECRET = "dev-only-secret-do-not-use-in-production";

const jwtSecret = process.env.JWT_SECRET?.trim() || "";

// A missing or placeholder secret lets anyone forge access tokens, so a
// production server refuses to start instead of running insecurely.
if (isProduction && (!jwtSecret || jwtSecret.startsWith("replace-with"))) {
  throw new Error("JWT_SECRET must be set to a long random value in production.");
}
if (jwtSecret && jwtSecret.length < 32) {
  console.warn("[config] JWT_SECRET is shorter than 32 characters; use a longer random value.");
}

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
// Public https address of this app (the Mini App URL and webhook host).
// Railway sets RAILWAY_PUBLIC_DOMAIN by itself, so usually nothing to set.
const publicAppUrl = (
  process.env.PUBLIC_APP_URL?.trim() ||
  (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : "")
).replace(/\/+$/, "");

export const config = {
  isProduction,
  telegram: {
    botToken: telegramBotToken,
    /** Optional; otherwise read from Telegram's getMe at startup. */
    botUsername: process.env.TELEGRAM_BOT_USERNAME?.trim().replace(/^@/, "") || "",
    publicAppUrl,
    /**
     * With a bot configured, students can only sign in through the Telegram
     * Mini App (TELEGRAM_STUDENT_ONLY=0 turns that off). Without a bot token
     * nothing changes, so deploying this before the bot exists is safe.
     */
    studentOnly: !!telegramBotToken && process.env.TELEGRAM_STUDENT_ONLY !== "0",
  },
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: jwtSecret || DEV_JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  refreshTokenExpiresDays: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS ?? 30),
  corsOrigins: (process.env.CORS_ORIGIN ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  /**
   * Express `trust proxy` setting. Set TRUST_PROXY=1 (number of proxy hops)
   * when the app runs behind nginx / a PaaS load balancer, so req.ip is the
   * real client IP (used by rate limiting and logs). Unset = trust nothing.
   */
  trustProxy: process.env.TRUST_PROXY
    ? /^\d+$/.test(process.env.TRUST_PROXY)
      ? Number(process.env.TRUST_PROXY)
      : process.env.TRUST_PROXY
    : false,
};
