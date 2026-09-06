'use server';

import { requireUserId } from '@/lib/auth-server';
import { generateRecipeSchema } from '@/lib/schemas/recipes';
import { AIGenerationError } from '@/services/ai';
import { consumeRecipeIngredients, PantryError } from '@/services/pantry';
import { generateAndSaveRecipe } from '@/services/recipeGenerator';
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
 */
export async function cookRecipeAction(
  recipeId: string,
  substitutions: Record<string, string> = {},
): Promise<ActionResult<CookRecipeResultDTO>> {
  const userId = await requireUserId();

  try {
    const data = await consumeRecipeIngredients(userId, recipeId, substitutions);
    return { success: true, data };
  } catch (e) {
    if (e instanceof PantryError) return { error: e.message };
    throw e;
  }
}
