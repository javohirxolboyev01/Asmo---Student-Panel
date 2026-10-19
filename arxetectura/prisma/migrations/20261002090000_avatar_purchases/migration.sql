-- CreateTable
CREATE TABLE "AvatarPurchase" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvatarPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AvatarPurchase_studentId_itemKey_key" ON "AvatarPurchase"("studentId", "itemKey");

-- AddForeignKey
ALTER TABLE "AvatarPurchase" ADD CONSTRAINT "AvatarPurchase_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
