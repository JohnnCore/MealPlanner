'use server';

import { requireUserId } from '@/lib/auth-server';
import { generateRecipeSchema } from '@/lib/schemas/recipes';
import { AIGenerationError } from '@/services/ai';
import { generateAndSaveRecipe } from '@/services/recipeGenerator';
import type { ActionResult } from '@/types/action';
import type { RecipeDTO } from '@/types/recipes';

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
