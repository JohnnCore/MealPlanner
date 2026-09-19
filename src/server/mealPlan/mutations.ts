import type { MealType } from '@prisma/client';

import prisma from '@/lib/prisma';
import { dateKeyToUtc } from '@/utils/mealPlan';

/** Puts a recipe in a slot, replacing whatever was planned there. */
export async function upsertMealPlanSlot(data: {
  userId: string;
  recipeId: string;
  dateKey: string;
  mealType: MealType;
  servings: number;
}) {
  const date = dateKeyToUtc(data.dateKey);
  const { userId, recipeId, mealType, servings } = data;

  return prisma.mealPlan.upsert({
    where: { userId_date_mealType: { userId, date, mealType } },
    create: { userId, recipeId, date, mealType, servings },
    update: { recipeId, servings },
    include: { recipe: true },
  });
}

/** Moves a plan into a slot, replacing whatever was planned there — atomically, so a failed move never loses the target. */
export async function moveMealPlan(
  id: string,
  data: { userId: string; dateKey: string; mealType: MealType },
) {
  const date = dateKeyToUtc(data.dateKey);

  const [, moved] = await prisma.$transaction([
    prisma.mealPlan.deleteMany({
      where: { userId: data.userId, date, mealType: data.mealType, NOT: { id } },
    }),
    prisma.mealPlan.update({
      where: { id },
      data: { date, mealType: data.mealType },
      include: { recipe: true },
    }),
  ]);

  return moved;
}

export async function markMealPlanCooked(id: string) {
  return prisma.mealPlan.update({
    where: { id },
    data: { cookedAt: new Date() },
    include: { recipe: true },
  });
}

export async function deleteMealPlan(id: string) {
  return prisma.mealPlan.delete({ where: { id } });
}
