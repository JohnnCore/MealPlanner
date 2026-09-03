import type { IngredientCategory } from '@prisma/client';

import { INGREDIENT_CATEGORY_ICONS } from '@/constants/ingredients';
import { findOrCreateIngredientForUser } from '@/server/ingredients/mutations';
import { getVisibleIngredientById } from '@/server/ingredients/queries';

/** Expected, user-facing failure — actions surface `message` verbatim. */
export class IngredientResolutionError extends Error {}

/**
 * Shared by every "pick an existing ingredient or create a new one" flow (Pantry's add
 * item, Shopping's add item): verifies visibility for a submitted `ingredientId`, or
 * find-or-creates a private ingredient from `name`+`category` when none was given.
 */
export async function resolveOrCreateIngredient(
  userId: string,
  input: { ingredientId?: string; name: string; category?: IngredientCategory; icon?: string },
) {
  if (input.ingredientId) {
    const ingredient = await getVisibleIngredientById(input.ingredientId, userId);
    if (!ingredient) throw new IngredientResolutionError('Ingredient not found');
    return ingredient;
  }

  if (!input.category) {
    throw new IngredientResolutionError('A category is required to create a new ingredient');
  }

  return findOrCreateIngredientForUser(userId, {
    name: input.name,
    category: input.category,
    icon: input.icon ?? INGREDIENT_CATEGORY_ICONS[input.category],
  });
}
