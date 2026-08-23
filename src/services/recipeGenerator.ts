import type { Prisma } from '@prisma/client';

import { createAIGeneration } from '@/server/ai/mutations';
import { createRecipe } from '@/server/recipes/mutations';
import { toRecipeDTO } from '@/server/recipes/queries';
import { generateRecipeFromPrompt } from '@/services/ai';
import type { RecipeDTO } from '@/types/recipes';

/**
 * Calls Gemini for a new recipe, persists it (Recipe + RecipeIngredient, upserting the
 * shared Ingredient catalogue), and logs the call to AIGeneration for audit/cost tracking.
 *
 * Pantry-aware "what can I make right now" scoring and allergy/diet filtering are deferred —
 * there's no pantry data to match against yet, and the allergy/diet rules live on User
 * (see services/profile.ts). Both slot in here once that's ready, without changing the
 * caller's contract.
 */
export async function generateAndSaveRecipe(userId: string, prompt: string): Promise<RecipeDTO> {
  const { recipe, raw, tokensUsed } = await generateRecipeFromPrompt(prompt);

  const saved = await createRecipe(userId, {
    title: recipe.title,
    description: recipe.description,
    servings: recipe.servings,
    cookTimeMinutes: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty,
    instructions: recipe.instructions,
    ingredients: recipe.ingredients,
  });

  // Best-effort audit log — a logging failure shouldn't undo an otherwise-successful save.
  await createAIGeneration({
    userId,
    type: 'RECIPE',
    prompt: { prompt },
    response: raw as unknown as Prisma.InputJsonValue,
    tokensUsed,
  }).catch(() => undefined);

  return toRecipeDTO(saved);
}
