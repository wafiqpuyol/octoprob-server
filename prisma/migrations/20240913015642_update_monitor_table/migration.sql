/*
  Warnings:

  - Made the column `url` on table `Monitor` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Monitor" ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "headers" DROP NOT NULL,
ALTER COLUMN "body" DROP NOT NULL;
