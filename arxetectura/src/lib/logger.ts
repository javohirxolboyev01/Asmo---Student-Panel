// src/lib/logger.ts — minimal structured logger (one JSON line per event in
// production so log tools can parse it; readable lines in development).
const isProduction = process.env.NODE_ENV === "production";

type Level = "info" | "warn" | "error";

const serializeError = (e: unknown) =>
  e instanceof Error ? { name: e.name, message: e.message, stack: e.stack, code: (e as any).code } : e;

const write = (level: Level, message: string, meta: Record<string, unknown> = {}) => {
  const fields = Object.fromEntries(
    Object.entries(meta).map(([k, v]) => [k, k === "error" ? serializeError(v) : v]),
  );
  if (isProduction) {
    const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...fields });
    (level === "error" ? console.error : console.log)(line);
  } else {
    (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(
      `[${level}] ${message}`,
      Object.keys(fields).length ? fields : "",
    );
  }
};

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
