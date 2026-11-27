-- Teacher "lesson starts in 30 minutes" reminders + new-test announcements (additive only).
CREATE TABLE "LessonReminder" (
    "id" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonReminder_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LessonReminder_sentAt_idx" ON "LessonReminder"("sentAt");

-- Students get one "new test" notification per test. Tests that already exist
-- count as announced, so editing an old test never notifies anyone.
ALTER TABLE "Quiz" ADD COLUMN "announcedAt" TIMESTAMP(3);
UPDATE "Quiz" SET "announcedAt" = "createdAt";
