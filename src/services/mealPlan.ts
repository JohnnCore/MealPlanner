import { markMealPlanCooked, moveMealPlan, upsertMealPlanSlot } from '@/server/mealPlan/mutations';
import {
  getMealPlanByIdAndUser,
  getMealPlanBySlot,
  toMealPlanDTO,
} from '@/server/mealPlan/queries';
import { getRecipeByIdAndAuthor } from '@/server/recipes/queries';
import type { MealPlanDTO, MealSlotTarget } from '@/types/mealPlan';

/** Expected, user-facing failure — actions surface `message` verbatim. */
export class MealPlanError extends Error {}

const COOKED_LOCKED = 'This meal is already cooked — remove it instead of changing it';

/**
 * Plans a recipe into a slot (defaulting to the recipe's own servings). The agenda is a
 * planner, not a record of stock or consumption, so nothing here touches the pantry.
 * Whatever was planned in the slot is replaced — unless it was already cooked.
 */
export async function planMeal(
  userId: string,
  recipeId: string,
  slot: MealSlotTarget,
): Promise<MealPlanDTO> {
  const recipe = await getRecipeByIdAndAuthor(recipeId, userId);
  if (!recipe) throw new MealPlanError('Recipe not found');

  const existing = await getMealPlanBySlot(userId, slot.date, slot.mealType);
  if (existing?.cookedAt) throw new MealPlanError(COOKED_LOCKED);

  const planned = await upsertMealPlanSlot({
    userId,
    recipeId,
    dateKey: slot.date,
    mealType: slot.mealType,
    servings: recipe.servings,
  });

  return toMealPlanDTO(planned);
}

/** Moves a planned meal to another slot, replacing (not swapping with) an uncooked meal there. */
export async function moveMeal(
  userId: string,
  mealPlanId: string,
  slot: MealSlotTarget,
): Promise<MealPlanDTO> {
  const mealPlan = await getMealPlanByIdAndUser(mealPlanId, userId);
  if (!mealPlan) throw new MealPlanError('Meal plan entry not found');
  if (mealPlan.cookedAt) throw new MealPlanError(COOKED_LOCKED);

  const target = await getMealPlanBySlot(userId, slot.date, slot.mealType);
  if (target?.cookedAt) throw new MealPlanError(COOKED_LOCKED);

  const moved = await moveMealPlan(mealPlanId, {
    userId,
    dateKey: slot.date,
    mealType: slot.mealType,
  });

  return toMealPlanDTO(moved);
}

/**
 * Confirms a planned meal can be cooked: it's the caller's, it's for `recipeId` (so a stale
 * or forged id can't mark another meal), and it wasn't cooked already. Run this *before*
 * consuming pantry stock so a rejected cook never leaves the pantry half-updated.
 */
export async function assertMealPlanCookable(
  userId: string,
  mealPlanId: string,
  recipeId: string,
): Promise<void> {
  const mealPlan = await getMealPlanByIdAndUser(mealPlanId, userId);
  if (!mealPlan || mealPlan.recipeId !== recipeId) {
    throw new MealPlanError('Meal plan entry not found');
  }
  if (mealPlan.cookedAt) throw new MealPlanError('This meal is already cooked');
}

/** Marks a planned meal as cooked — called once the cook flow has consumed the recipe's pantry ingredients. */
export async function markMealCooked(userId: string, mealPlanId: string): Promise<MealPlanDTO> {
  const mealPlan = await getMealPlanByIdAndUser(mealPlanId, userId);
  if (!mealPlan) throw new MealPlanError('Meal plan entry not found');

  return toMealPlanDTO(await markMealPlanCooked(mealPlanId));
}
