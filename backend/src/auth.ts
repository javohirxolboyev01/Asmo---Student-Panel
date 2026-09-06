import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "./config";
import { prisma } from "./lib/prisma";

const SALT_ROUNDS = 10;
const REFRESH_TOKEN_BYTES = 40;

export const ROLES = { STUDENT: "STUDENT", TEACHER: "TEACHER", ADMIN: "ADMIN" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, SALT_ROUNDS);

export const comparePassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);

export const signAccessToken = (payload: AccessTokenPayload): string =>
  jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, config.jwtSecret) as AccessTokenPayload;

const hashRefreshToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");

const createRefreshTokenRecord = async (userId: string): Promise<string> => {
  const token = crypto.randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.refreshTokenExpiresDays);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(token),
      expiresAt,
    },
  });

  return token;
};

export const issueTokenPair = async (userId: string, role: Role): Promise<TokenPair> => {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = await createRefreshTokenRecord(userId);
  return { accessToken, refreshToken };
};

export class RefreshTokenError extends Error {}

// Rotates a refresh token: validates it, revokes it, and issues a fresh pair.
export const rotateRefreshToken = async (token: string): Promise<TokenPair> => {
  const tokenHash = hashRefreshToken(token);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!record || record.revokedAt || record.expiresAt < new Date()) {
    throw new RefreshTokenError("Refresh token noto'g'ri yoki muddati tugagan");
  }

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { revokedAt: new Date() },
  });

  return issueTokenPair(record.userId, record.user.role as Role);
};

export const revokeAllRefreshTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};
