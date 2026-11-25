import { Router } from "express";
import { z } from "zod";
import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, loginLimit, refreshLimit, registerLimit, requireAuth, validate } from "../../middleware/index.js";
import { publicUser, userSummary } from "../../utils/serializers.js";
import { uid } from "../../utils/teacherScope.js";
import { authenticate, issueAccessToken, issueRefreshToken, register, studentNeedsTelegram } from "./auth.service.js";
import { config } from "../../config.js";
import { getBotUsername } from "../telegram/telegram.bot.js";

const TELEGRAM_ONLY_MESSAGE = "O'quvchilar ilovani faqat Telegram bot orqali ochadi.";

export const authRouter = Router();

export const authSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    // bcrypt only uses the first 72 bytes; the cap also stops huge-input CPU abuse.
    password: z.string().min(6).max(128),
    firstName: z.string().trim().min(2).max(60).optional(),
    lastName: z.string().trim().min(2).max(60).optional(),
    phone: z.string().trim().max(32).optional(),
    role: z.enum(["student", "teacher"]).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});

authRouter.post(
  "/auth/register",
  registerLimit,
  validate(authSchema),
  asyncRoute(async (req: any, res: any) => {
    // Students get their account from a teacher and open the app from the bot.
    if (config.telegram.studentOnly)
      return res.status(403).json({ error: TELEGRAM_ONLY_MESSAGE, code: "TELEGRAM_ONLY" });
    res.status(201).json(
      await register({
        ...req.body,
        firstName: req.body.firstName ?? "Student",
        lastName: req.body.lastName ?? "User",
        // Public self-registration is always a student account. Teacher
        // accounts are created only via the staff-only POST /teachers route.
        role: "student",
      }),
    );
  }),
);

authRouter.post(
  "/auth/login",
  ...loginLimit,
  validate(authSchema),
  asyncRoute(async (req: any, res: any) => {
    const result = await authenticate(req.body.email, req.body.password);
    if (!result) return res.status(401).json({ error: "Email or password is incorrect" });
    if ("telegramOnly" in result)
      return res.status(403).json({ error: TELEGRAM_ONLY_MESSAGE, code: "TELEGRAM_ONLY" });
    res.json(result);
  }),
);

authRouter.post(
  "/auth/refresh",
  refreshLimit,
  asyncRoute(async (req: any, res: any) => {
    try {
      const hash = crypto.createHash("sha256").update(req.body.refreshToken ?? "").digest("hex");
      const token = await prisma.refreshToken.findUnique({ where: { tokenHash: hash }, include: { User: true } });
      if (!token || token.revokedAt || token.expiresAt < new Date() || token.User.status !== "ACTIVE")
        return res.status(401).json({ error: "Invalid refresh token" });
      if (studentNeedsTelegram(token.User.role, token.viaTelegram))
        return res.status(401).json({ error: TELEGRAM_ONLY_MESSAGE, code: "TELEGRAM_ONLY" });
      // Revoke atomically: of two parallel requests with the same token only one wins.
      const { count } = await prisma.refreshToken.updateMany({
        where: { id: token.id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (count === 0) return res.status(401).json({ error: "Invalid refresh token" });
      res.json({
        user: await prisma.user.findUniqueOrThrow({ where: { id: token.userId }, select: publicUser }),
        accessToken: issueAccessToken(token.User, token.viaTelegram),
        refreshToken: await issueRefreshToken(token.userId, token.viaTelegram),
      });
    } catch {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  }),
);

// Public: tells the login screen whether students must use the Telegram bot.
authRouter.get("/auth/options", (_req, res) =>
  res.json({
    studentTelegramOnly: config.telegram.studentOnly,
    telegramBot: getBotUsername() || null,
  }),
);

// Logout: revokes the given refresh token so it can't be reused (idempotent;
// the access token simply expires on its own).
authRouter.post(
  "/auth/logout",
  asyncRoute(async (req: any, res: any) => {
    const raw = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";
    if (raw) {
      const hash = crypto.createHash("sha256").update(raw).digest("hex");
      await prisma.refreshToken.updateMany({
        where: { tokenHash: hash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    res.status(204).end();
  }),
);

authRouter.get(
  "/auth/me",
  requireAuth,
  asyncRoute(async (req: any, res: any) =>
    res.json(userSummary(await prisma.user.findUniqueOrThrow({ where: { id: uid(req) } }))),
  ),
);
