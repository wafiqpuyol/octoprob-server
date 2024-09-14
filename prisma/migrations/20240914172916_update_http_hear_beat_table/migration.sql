/*
  Warnings:

  - You are about to alter the column `monitorId` on the `HttpHeartbeat` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "HttpHeartbeat" ALTER COLUMN "monitorId" SET DATA TYPE INTEGER,
ALTER COLUMN "timestamp" SET DATA TYPE BIGINT;
