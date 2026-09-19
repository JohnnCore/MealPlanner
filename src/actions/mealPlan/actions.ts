'use server';

import { requireUserId } from '@/lib/auth-server';
import { mealSlotSchema, planMealSchema } from '@/lib/schemas/mealPlan';
import { deleteMealPlan } from '@/server/mealPlan/mutations';
import { getMealPlanByIdAndUser } from '@/server/mealPlan/queries';
import { MealPlanError, moveMeal, planMeal } from '@/services/mealPlan';
import type { ActionResult } from '@/types/action';
import type { MealPlanDTO } from '@/types/mealPlan';

export async function planMealAction(input: unknown): Promise<ActionResult<MealPlanDTO>> {
  const userId = await requireUserId();

  const parsed = planMealSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid meal slot' };

  try {
    const { recipeId, ...slot } = parsed.data;
    return { success: true, data: await planMeal(userId, recipeId, slot) };
  } catch (e) {
    if (e instanceof MealPlanError) return { error: e.message };
    throw e;
  }
}

export async function moveMealPlanAction(
  id: string,
  input: unknown,
): Promise<ActionResult<MealPlanDTO>> {
  const userId = await requireUserId();

  const parsed = mealSlotSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid meal slot' };

  try {
    return { success: true, data: await moveMeal(userId, id, parsed.data) };
  } catch (e) {
    if (e instanceof MealPlanError) return { error: e.message };
    throw e;
  }
}

export async function deleteMealPlanAction(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();

  const existing = await getMealPlanByIdAndUser(id, userId);
  if (!existing) return { error: 'Meal plan entry not found' };

  await deleteMealPlan(id);
  return { success: true, data: null };
}
