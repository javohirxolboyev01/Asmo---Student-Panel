// src/modules/telegram/telegram.link.ts — one-time codes that link a student to a Telegram account.
import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";

// No 0/O/1/I: the code is read aloud and typed by hand.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
export const CODE_TTL_DAYS = 7;

const hashCode = (code: string) => crypto.createHash("sha256").update(code).digest("hex");

/** Upper-cases and strips spaces/dashes, so "abcd-efgh" and "ABCD EFGH" both work. */
export const normalizeCode = (raw: string) => raw.toUpperCase().replace(/[\s-]/g, "");
export const looksLikeCode = (code: string) =>
  code.length === CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c));

/** Creates a fresh code for the student (any previous unused code stops working). */
export async function createLinkCode(studentId: string) {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  const code = [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("");
  const expiresAt = new Date(Date.now() + CODE_TTL_DAYS * 86400000);
  await prisma.user.update({
    where: { id: studentId },
    data: { linkCodeHash: hashCode(code), linkCodeExpiresAt: expiresAt, updatedAt: new Date() },
  });
  return { code, expiresAt };
}

/**
 * Redeems a code for a Telegram account. One Telegram account belongs to one
 * student: linking moves it away from anyone who had it, and the student's
 * earlier Telegram sessions are revoked (a new phone/account replaces the old).
 */
export async function redeemLinkCode(code: string, telegram: { id: number; username?: string }) {
  const telegramId = String(telegram.id);
  return prisma.$transaction(async (tx) => {
    const student = await tx.user.findFirst({
      where: {
        linkCodeHash: hashCode(code),
        linkCodeExpiresAt: { gt: new Date() },
        role: "STUDENT",
        status: "ACTIVE",
      },
    });
    if (!student) return null;
    const previous = await tx.user.findMany({
      where: { OR: [{ telegramId }, { id: student.id }] },
      select: { id: true },
    });
    await tx.refreshToken.updateMany({
      where: { userId: { in: previous.map((u) => u.id) }, viaTelegram: true, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await tx.user.updateMany({
      where: { telegramId, id: { not: student.id } },
      data: { telegramId: null, telegramUsername: null, updatedAt: new Date() },
    });
    return tx.user.update({
      where: { id: student.id },
      data: {
        telegramId,
        telegramUsername: telegram.username ?? null,
        linkCodeHash: null,
        linkCodeExpiresAt: null,
        updatedAt: new Date(),
      },
    });
  });
}

/** Teacher action: detaches Telegram and ends the student's Mini App sessions. */
export async function unlinkTelegram(studentId: string) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: studentId },
      data: { telegramId: null, telegramUsername: null, linkCodeHash: null, linkCodeExpiresAt: null, updatedAt: new Date() },
    }),
    prisma.refreshToken.updateMany({
      where: { userId: studentId, viaTelegram: true, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}
