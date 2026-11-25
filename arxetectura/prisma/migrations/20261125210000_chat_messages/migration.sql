-- Teacher ↔ family chat through the Telegram bot (additive only).
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromStudent" BOOLEAN NOT NULL,
    "senderName" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'text',
    "text" TEXT NOT NULL,
    "fileId" TEXT,
    "duration" INTEGER,
    "archiveMessageId" INTEGER,
    "archiveFileId" TEXT,
    "archivedAt" TIMESTAMP(3),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatMessage_studentId_createdAt_idx" ON "ChatMessage"("studentId", "createdAt");
CREATE INDEX "ChatMessage_fromStudent_isRead_idx" ON "ChatMessage"("fromStudent", "isRead");
CREATE INDEX "ChatMessage_archivedAt_createdAt_idx" ON "ChatMessage"("archivedAt", "createdAt");

ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
