-- DropForeignKey
ALTER TABLE "Mission" DROP CONSTRAINT "Mission_quizId_fkey";

-- CreateIndex
CREATE INDEX "CoinTransaction_createdAt_idx" ON "CoinTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "Submission_studentId_submittedAt_idx" ON "Submission"("studentId", "submittedAt");

-- CreateIndex
CREATE INDEX "Submission_studentId_gradedAt_idx" ON "Submission"("studentId", "gradedAt");

-- AddForeignKey
ALTER TABLE "Mission" ADD CONSTRAINT "Mission_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

