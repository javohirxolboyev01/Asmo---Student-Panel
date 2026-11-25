-- Payment due dates for Telegram reminders / overdue notices (additive only).
-- Existing rows get hasDueDate = false, so they are never auto-marked overdue.
ALTER TABLE "Payment" ADD COLUMN "hasDueDate" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Payment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "overdueNotifiedAt" TIMESTAMP(3);
CREATE INDEX "Payment_status_hasDueDate_dueDate_idx" ON "Payment"("status", "hasDueDate", "dueDate");
