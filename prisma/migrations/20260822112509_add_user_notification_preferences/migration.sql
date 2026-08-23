-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowSharedLists" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyPush" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "weeklyDigest" BOOLEAN NOT NULL DEFAULT true;
