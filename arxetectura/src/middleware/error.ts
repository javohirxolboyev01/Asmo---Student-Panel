import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "../lib/logger.js";

/** Wraps an async route handler so rejected promises reach the error handler. */
export const asyncRoute = (handler: any): RequestHandler => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

/**
 * Turns any thrown error into a JSON response. Client mistakes become 4xx
 * with a safe message; everything else is logged with request context and
 * answered with a generic 500 (no internals leak to the client).
 */
export const errorHandler: ErrorRequestHandler = (error: any, req, res, next) => {
  if (res.headersSent) return next(error);

  // Body parser: malformed JSON / body too large.
  if (error?.type === "entity.parse.failed")
    return res.status(400).json({ error: "Invalid JSON body" });
  if (error?.type === "entity.too.large")
    return res.status(413).json({ error: "Request body is too large" });

  if (typeof error?.status === "number" && error.status >= 400 && error.status < 500)
    return res.status(error.status).json({ error: error.message });

  // Prisma known request errors.
  switch (error?.code) {
    case "P2002": {
      const target = String(error?.meta?.target ?? "");
      return res
        .status(409)
        .json({ error: target.includes("email") ? "Email already registered" : "Already exists" });
    }
    case "P2025":
      return res.status(404).json({ error: "Not found" });
    case "P2003":
      return res.status(409).json({ error: "Related record is missing or still in use" });
    case "P2023":
      return res.status(400).json({ error: "Invalid id" });
  }

  logger.error("request failed", {
    requestId: res.locals.requestId,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.id,
    error,
  });
  res.status(500).json({ error: "Internal server error", requestId: res.locals.requestId });
};
