// src/modules/telegram/telegram.routes.ts
import crypto from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { config } from "../../config.js";
import { asyncRoute, idSchema, rateLimit, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { publicUser } from "../../utils/serializers.js";
import { assertStudent } from "../../utils/teacherScope.js";
import { issueAccessToken, issueRefreshToken } from "../auth/auth.service.js";
import { verifyInitData } from "./telegram.auth.js";
import { createLinkCode, unlinkTelegram } from "./telegram.link.js";
import { getBotUsername, handleUpdate, webhookSecret } from "./telegram.bot.js";

export const telegramRouter = Router();

const notConfigured = (res: any) =>
  res.status(503).json({ error: "Telegram bot is not configured", code: "TELEGRAM_NOT_CONFIGURED" });

// Telegram → us. Answer at once; the update is handled in the background.
telegramRouter.post("/telegram/webhook", (req, res) => {
  const given = Buffer.from(req.get("x-telegram-bot-api-secret-token") ?? "");
  const expected = Buffer.from(config.telegram.botToken ? webhookSecret() : "");
  if (!expected.length || given.length !== expected.length || !crypto.timingSafeEqual(given, expected))
    return res.status(401).end();
  res.status(200).end();
  void handleUpdate(req.body);
});

const telegramLoginLimit = rateLimit({
  windowMs: 15 * 60_000,
  max: 120,
  key: (req) => `ip:${req.ip}`,
});

// Mini App sign-in: the signed launch data proves which Telegram user this is.
telegramRouter.post(
  "/auth/telegram",
  telegramLoginLimit,
  validate(
    z.object({ body: z.object({ initData: z.string().min(1).max(4096) }), params: z.object({}), query: z.object({}) }),
  ),
  asyncRoute(async (req: any, res: any) => {
    if (!config.telegram.botToken) return notConfigured(res);
    const tgUser = verifyInitData(req.body.initData);
    if (!tgUser) return res.status(401).json({ error: "Invalid Telegram data", code: "TELEGRAM_INVALID" });
    const user = await prisma.user.findUnique({ where: { telegramId: String(tgUser.id) } });
    if (!user || user.role !== "STUDENT" || user.status !== "ACTIVE")
      return res.status(404).json({ error: "This Telegram account is not linked", code: "TELEGRAM_NOT_LINKED" });
    if (tgUser.username && tgUser.username !== user.telegramUsername)
      await prisma.user.update({ where: { id: user.id }, data: { telegramUsername: tgUser.username } });
    res.json({
      user: await prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: publicUser }),
      accessToken: issueAccessToken(user, true),
      refreshToken: await issueRefreshToken(user.id, true),
    });
  }),
);

const staff = ["TEACHER", "ADMIN"];

const linkInfo = (code?: { code: string; expiresAt: Date }) => {
  const bot = getBotUsername();
  return {
    bot: bot || null,
    ...(code
      ? {
          code: `${code.code.slice(0, 4)}-${code.code.slice(4)}`,
          expiresAt: code.expiresAt,
          link: bot ? `https://t.me/${bot}?start=${code.code}` : null,
        }
      : {}),
  };
};

telegramRouter.get(
  "/students/:id/telegram",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.id);
    res.json({
      enabled: !!config.telegram.botToken,
      linked: !!student.telegramId,
      username: student.telegramUsername,
      pendingCodeExpiresAt:
        student.linkCodeExpiresAt && student.linkCodeExpiresAt > new Date() ? student.linkCodeExpiresAt : null,
      ...linkInfo(),
    });
  }),
);

// The code is shown once; only its hash is stored.
telegramRouter.post(
  "/students/:id/telegram-code",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    if (!config.telegram.botToken) return notConfigured(res);
    const student = await assertStudent(req, req.params.id);
    if (student.status !== "ACTIVE") return res.status(409).json({ error: "Student is archived" });
    res.status(201).json(linkInfo(await createLinkCode(student.id)));
  }),
);

telegramRouter.delete(
  "/students/:id/telegram",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.id);
    await unlinkTelegram(student.id);
    res.status(204).end();
  }),
);
