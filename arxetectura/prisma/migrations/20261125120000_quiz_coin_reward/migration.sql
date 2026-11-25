-- Tests pay coins themselves (missions are gone from the UI).
-- Additive only: existing quizzes get 0 coins (no reward) until a teacher sets one.
ALTER TABLE "Quiz" ADD COLUMN "coinReward" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Quiz" ADD COLUMN "passPercent" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "QuizAttempt" ADD COLUMN "coins" INTEGER NOT NULL DEFAULT 0;
