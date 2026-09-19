import type { MealType } from '@prisma/client';

import prisma from '@/lib/prisma';
import type { MealPlanDTO } from '@/types/mealPlan';
import { dateKeyToUtc } from '@/utils/mealPlan';

export async function getMealPlansForUserInRange(userId: string, startKey: string, endKey: string) {
  return prisma.mealPlan.findMany({
    where: { userId, date: { gte: dateKeyToUtc(startKey), lte: dateKeyToUtc(endKey) } },
    include: { recipe: true },
    orderBy: { date: 'asc' },
  });
}

export async function getMealPlanByIdAndUser(id: string, userId: string) {
  return prisma.mealPlan.findFirst({ where: { id, userId } });
}

export async function getMealPlanBySlot(userId: string, dateKey: string, mealType: MealType) {
  return prisma.mealPlan.findUnique({
    where: { userId_date_mealType: { userId, date: dateKeyToUtc(dateKey), mealType } },
  });
}

type MealPlanWithRecipe = Awaited<ReturnType<typeof getMealPlansForUserInRange>>[number];

export function toMealPlanDTO(mealPlan: MealPlanWithRecipe): MealPlanDTO {
  return {
    id: mealPlan.id,
    recipeId: mealPlan.recipeId,
    recipeTitle: mealPlan.recipe.title,
    difficulty: mealPlan.recipe.difficulty,
    cookTimeMinutes: mealPlan.recipe.cookTimeMinutes,
    date: mealPlan.date.toISOString().slice(0, 10),
    mealType: mealPlan.mealType,
    servings: mealPlan.servings,
    cookedAt: mealPlan.cookedAt ? mealPlan.cookedAt.toISOString() : null,
  };
}
