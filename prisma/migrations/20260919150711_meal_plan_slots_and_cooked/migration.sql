-- AlterEnum
BEGIN;
CREATE TYPE "MealType_new" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');
ALTER TABLE "public"."MealPlan" ALTER COLUMN "mealType" DROP DEFAULT;
ALTER TABLE "MealPlan" ALTER COLUMN "mealType" TYPE "MealType_new" USING ("mealType"::text::"MealType_new");
ALTER TYPE "MealType" RENAME TO "MealType_old";
ALTER TYPE "MealType_new" RENAME TO "MealType";
DROP TYPE "public"."MealType_old";
COMMIT;

-- AlterTable
ALTER TABLE "MealPlan" ADD COLUMN     "cookedAt" TIMESTAMP(3),
ALTER COLUMN "date" SET DATA TYPE DATE,
ALTER COLUMN "mealType" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_userId_date_mealType_key" ON "MealPlan"("userId", "date", "mealType");

