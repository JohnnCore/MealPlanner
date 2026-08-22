-- CreateEnum
CREATE TYPE "ListColor" AS ENUM ('PRIMARY', 'SECONDARY', 'GREEN', 'BLUE', 'PURPLE', 'ORANGE', 'PINK', 'INDIGO');

-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN     "color" "ListColor" NOT NULL DEFAULT 'PRIMARY';
