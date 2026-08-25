-- CreateEnum
CREATE TYPE "RecipeDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "cookTimeMinutes" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "difficulty" "RecipeDifficulty" NOT NULL DEFAULT 'EASY';
