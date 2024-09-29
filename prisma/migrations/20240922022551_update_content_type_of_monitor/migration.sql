/*
  Warnings:

  - The `contentType` column on the `Monitor` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "contentType",
ADD COLUMN     "contentType" JSONB;
