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

export const config = {
  isProduction,
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
