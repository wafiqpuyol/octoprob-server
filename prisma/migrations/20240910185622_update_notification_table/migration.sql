/*
  Warnings:

  - A unique constraint covering the columns `[groupName]` on the table `Notifications` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Notifications_groupName_key" ON "Notifications"("groupName");
