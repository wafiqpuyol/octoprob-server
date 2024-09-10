-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "groupName" TEXT NOT NULL,
    "emails" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Group_userId_idx" ON "Group"("userId");

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "username_email" RENAME TO "User_username_email_idx";
