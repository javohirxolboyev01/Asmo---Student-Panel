// src/middleware/rateLimit.ts — small in-memory fixed-window rate limiter.
//
// Single-process only (the app runs as one Node process). If the backend is
// ever scaled to several instances, move the counters to Redis/Postgres.
//
// Limits are keyed by whatever `key(req)` returns. Students at a learning
// centre often share one public IP, so IP limits are generous and the strict
// limits are per account (email).
import type { Request, RequestHandler } from "express";

type Bucket = { count: number; resetAt: number };

export interface RateLimitOptions {
  /** Window length in ms. */
  windowMs: number;
  /** Max requests per key per window. */
  max: number;
  /** Bucket key; return null to skip limiting this request. */
  key: (req: Request) => string | null;
  /** Count only requests that end with status >= 400 (e.g. failed logins). */
  failedOnly?: boolean;
}

const stores: Map<string, Bucket>[] = [];

// Drop expired buckets once a minute so memory stays bounded.
setInterval(() => {
  const now = Date.now();
  for (const store of stores)
    for (const [k, b] of store) if (b.resetAt <= now) store.delete(k);
}, 60_000).unref();

export const rateLimit = ({ windowMs, max, key, failedOnly = false }: RateLimitOptions): RequestHandler => {
  const store = new Map<string, Bucket>();
  stores.push(store);

  return (req, res, next) => {
    const k = key(req);
    if (!k) return next();
    const now = Date.now();
    let bucket = store.get(k);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      store.set(k, bucket);
    }

    if (bucket.count >= max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: `Juda ko'p urinish. ${Math.ceil(retryAfter / 60)} daqiqadan keyin qayta urinib ko'ring.`,
        code: "RATE_LIMITED",
        retryAfter,
      });
    }

    if (failedOnly) {
      const b = bucket;
      res.on("finish", () => {
        if (res.statusCode >= 400 && res.statusCode !== 429) b.count += 1;
      });
    } else {
      bucket.count += 1;
    }
    next();
  };
};

export const clientIp = (req: Request) => req.ip ?? req.socket.remoteAddress ?? "unknown";

const emailOf = (req: Request) =>
  typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase().slice(0, 254) : null;

const MIN = 60_000;

/** Login: 10 failed attempts per account per 15 min, 300 attempts per IP. */
export const loginLimit: RequestHandler[] = [
  rateLimit({ windowMs: 15 * MIN, max: 300, key: (req) => `ip:${clientIp(req)}` }),
  rateLimit({
    windowMs: 15 * MIN,
    max: 10,
    failedOnly: true,
    key: (req) => (emailOf(req) ? `email:${emailOf(req)}` : null),
  }),
];

/** Self-registration: 30 accounts per IP per hour (a whole class can still sign up). */
export const registerLimit = rateLimit({ windowMs: 60 * MIN, max: 30, key: (req) => `ip:${clientIp(req)}` });

/** Token refresh: plenty for normal use, stops token guessing floods. */
export const refreshLimit = rateLimit({ windowMs: 15 * MIN, max: 300, key: (req) => `ip:${clientIp(req)}` });

/** Generic write limiter for expensive endpoints (uploads, checkout, …). */
export const writeLimit = rateLimit({
  windowMs: MIN,
  max: 120,
  key: (req) => (req.user ? `user:${req.user.id}` : `ip:${clientIp(req)}`),
});
