-- Files kept on Telegram (homework attachments, profile photos). Additive only.
CREATE TABLE "StoredFile" (
    "id" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ownerId" TEXT,
    "mime" TEXT NOT NULL,
    "name" TEXT,
    "size" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoredFile_ownerId_idx" ON "StoredFile"("ownerId");
