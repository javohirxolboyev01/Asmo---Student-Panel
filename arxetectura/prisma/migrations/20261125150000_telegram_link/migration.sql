-- Telegram Mini App login for students (additive only).
ALTER TABLE "User" ADD COLUMN "telegramId" TEXT;
ALTER TABLE "User" ADD COLUMN "telegramUsername" TEXT;
ALTER TABLE "User" ADD COLUMN "linkCodeHash" TEXT;
ALTER TABLE "User" ADD COLUMN "linkCodeExpiresAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
CREATE UNIQUE INDEX "User_linkCodeHash_key" ON "User"("linkCodeHash");

ALTER TABLE "RefreshToken" ADD COLUMN "viaTelegram" BOOLEAN NOT NULL DEFAULT false;
