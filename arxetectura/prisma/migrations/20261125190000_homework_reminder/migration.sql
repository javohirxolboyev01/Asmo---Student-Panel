-- Telegram reminder 2 hours before a homework deadline (additive only).
ALTER TABLE "Homework" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
CREATE INDEX "Homework_reminderSentAt_deadline_idx" ON "Homework"("reminderSentAt", "deadline");
