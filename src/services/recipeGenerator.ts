import type { Prisma } from '@prisma/client';

import { createAIGeneration } from '@/server/ai/mutations';
import { getUserDietaryProfile } from '@/server/profile/queries';
import { createRecipe } from '@/server/recipes/mutations';
import { toRecipeDTO } from '@/server/recipes/queries';
import { AIGenerationError, generateRecipeFromPrompt } from '@/services/ai';
import type { GeneratedRecipe, RecipeDTO } from '@/types/recipes';
import { findAllergenMatches, findDietViolations } from '@/utils/dietarySafety';

/**
 * Calls Gemini for a new recipe, persists it (Recipe + RecipeIngredient, upserting the
 * shared Ingredient catalogue), and logs the call to AIGeneration for audit/cost tracking.
 *
 * Every call is constrained by the user's profile: `servings` defaults to
 * `defaultServings` (overridable per request), and `dietType` + allergies are passed to
 * Gemini as hard requirements. The response is also checked programmatically
 * (utils/dietarySafety.ts) — the prompt instruction is the primary defense, but for
 * something safety-relevant like a food allergy, a second, code-level check that can
 * trigger one retry is worth the ~2s it costs on the rare attempt that needs it.
 *
 * Pantry-aware "what can I make right now" scoring is still deferred — there's no pantry
 * data to match against yet. It slots in here once that's ready, without changing the
 * caller's contract.
 */
export async function generateAndSaveRecipe(
  userId: string,
  prompt: string,
  requestedServings?: number,
): Promise<RecipeDTO> {
  const profile = await getUserDietaryProfile(userId);
  if (!profile) throw new AIGenerationError('User not found. Please log out and sign in again.');

  const constraints = {
    servings: requestedServings ?? profile.defaultServings,
    dietType: profile.dietType,
    allergyNames: profile.allergyNames,
  };

  const violations = (recipe: GeneratedRecipe) => [
    ...findAllergenMatches(
      recipe.ingredients.map(i => i.name),
      constraints.allergyNames,
    ),
    ...findDietViolations(recipe.ingredients, constraints.dietType),
  ];

  let { recipe, raw, tokensUsed } = await generateRecipeFromPrompt(prompt, constraints);
  let flagged = violations(recipe);

  if (flagged.length > 0) {
    const retryHint =
      `The previous attempt included ${flagged.join(', ')}, which conflicts with the ` +
      "user's diet or allergies. Regenerate the whole recipe without any of these.";

    ({ recipe, raw, tokensUsed } = await generateRecipeFromPrompt(prompt, constraints, retryHint));
    flagged = violations(recipe);

    if (flagged.length > 0) {
      throw new AIGenerationError(
        "Couldn't generate a recipe that fits your diet and allergies — try a more specific request.",
      );
    }
  }

  const saved = await createRecipe(userId, {
    title: recipe.title,
    description: recipe.description,
    // Authoritative from the request, not the model's self-report — guarantees the
    // persisted recipe always matches what was actually asked for.
    servings: constraints.servings,
    cookTimeMinutes: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty,
    instructions: recipe.instructions,
    ingredients: recipe.ingredients,
  });

  // Best-effort audit log — a logging failure shouldn't undo an otherwise-successful save.
  await createAIGeneration({
    userId,
    type: 'RECIPE',
    prompt: { prompt, constraints },
    response: raw as unknown as Prisma.InputJsonValue,
    tokensUsed,
  }).catch(() => undefined);

  return toRecipeDTO(saved);
}
