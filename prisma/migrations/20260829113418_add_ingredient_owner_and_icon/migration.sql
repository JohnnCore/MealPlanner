-- DropIndex
DROP INDEX "Ingredient_name_key";

-- AlterTable
ALTER TABLE "Ingredient" ADD COLUMN     "createdByUserId" TEXT,
ADD COLUMN     "icon" TEXT NOT NULL DEFAULT '🥘';

-- CreateIndex
CREATE INDEX "Ingredient_createdByUserId_idx" ON "Ingredient"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_name_createdByUserId_key" ON "Ingredient"("name", "createdByUserId");

-- AddForeignKey
ALTER TABLE "Ingredient" ADD CONSTRAINT "Ingredient_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
