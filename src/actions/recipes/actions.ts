'use server';

import { requireUserId } from '@/lib/auth-server';
import { generateRecipeSchema, saveRecipeSchema } from '@/lib/schemas/recipes';
import { AIGenerationError } from '@/services/ai';
import { IngredientResolutionError } from '@/services/ingredients';
import { assertMealPlanCookable, markMealCooked, MealPlanError } from '@/services/mealPlan';
import { consumeRecipeIngredients, PantryError } from '@/services/pantry';
import { generateAndSaveRecipe } from '@/services/recipeGenerator';
import {
  cloneUserRecipe,
  createUserRecipe,
  deleteUserRecipe,
  RecipeError,
  updateUserRecipe,
} from '@/services/recipes';
import type { ActionResult } from '@/types/action';
import type { CookRecipeResultDTO, RecipeDTO } from '@/types/recipes';

export async function generateRecipeAction(input: unknown): Promise<ActionResult<RecipeDTO>> {
  const userId = await requireUserId();

  const parsed = generateRecipeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid request' };

  try {
    const data = await generateAndSaveRecipe(userId, parsed.data.prompt, parsed.data.servings);
    return { success: true, data };
  } catch (e) {
    if (e instanceof AIGenerationError) return { error: e.message };
    throw e;
  }
}

/**
 * Marks a recipe as cooked, consuming its ingredients from the pantry — see
 * `services/pantry.ts`. `substitutions` (recipe ingredient id -> pantry ingredient id)
 * carries the user's picks from any "possible match" they confirmed in `CookRecipeDialog`.
 * When cooked from the Meal Planner, `mealPlanId` also marks that planned meal as cooked.
 */
export async function cookRecipeAction(
  recipeId: string,
  substitutions: Record<string, string> = {},
  mealPlanId?: string,
): Promise<ActionResult<CookRecipeResultDTO>> {
  const userId = await requireUserId();

  try {
    if (mealPlanId) await assertMealPlanCookable(userId, mealPlanId, recipeId);
    const data = await consumeRecipeIngredients(userId, recipeId, substitutions);
    if (mealPlanId) await markMealCooked(userId, mealPlanId);
    return { success: true, data };
  } catch (e) {
    if (e instanceof PantryError || e instanceof MealPlanError) return { error: e.message };
    throw e;
  }
}

export async function createRecipeAction(input: unknown): Promise<ActionResult<RecipeDTO>> {
  const userId = await requireUserId();

  const parsed = saveRecipeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid recipe' };

  try {
    return { success: true, data: await createUserRecipe(userId, parsed.data) };
  } catch (e) {
    if (e instanceof RecipeError || e instanceof IngredientResolutionError) {
      return { error: e.message };
    }
    throw e;
  }
}

/** Edits any recipe the user owns — hand-written or AI-generated. */
export async function updateRecipeAction(
  recipeId: string,
  input: unknown,
): Promise<ActionResult<RecipeDTO>> {
  const userId = await requireUserId();

  const parsed = saveRecipeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid recipe' };

  try {
    return { success: true, data: await updateUserRecipe(userId, recipeId, parsed.data) };
  } catch (e) {
    if (e instanceof RecipeError || e instanceof IngredientResolutionError) {
      return { error: e.message };
    }
    throw e;
  }
}

/** Soft-deletes a recipe and removes it from any upcoming (uncooked) planned meals. */
export async function deleteRecipeAction(recipeId: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();

  try {
    await deleteUserRecipe(userId, recipeId);
    return { success: true, data: null };
  } catch (e) {
    if (e instanceof RecipeError) return { error: e.message };
    throw e;
  }
}

export async function cloneRecipeAction(recipeId: string): Promise<ActionResult<RecipeDTO>> {
  const userId = await requireUserId();

  try {
    return { success: true, data: await cloneUserRecipe(userId, recipeId) };
  } catch (e) {
    if (e instanceof RecipeError) return { error: e.message };
    throw e;
  }
}
