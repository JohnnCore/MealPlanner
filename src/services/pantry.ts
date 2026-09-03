import type { AddPantryItemInput } from '@/lib/schemas/pantry';
import { createPantryItem, incrementPantryItemQuantity } from '@/server/pantry/mutations';
import { getPantryItemByUserAndIngredient, toPantryItemDTO } from '@/server/pantry/queries';
import { IngredientResolutionError, resolveOrCreateIngredient } from '@/services/ingredients';
import type { PantryItemDTO } from '@/types/pantry';

/** Expected, user-facing failure — actions surface `message` verbatim. */
export class PantryError extends Error {}

/**
 * Resolves the ingredient (an existing one the user can see, or a newly created private
 * one), then either creates a new pantry row or — if the user already has this ingredient
 * — increments its quantity and refreshes the expiry with what was just submitted. Spans
 * two `server/` modules plus this increment-or-create rule, so it belongs here rather than
 * being inlined in the action.
 */
export async function addPantryItem(
  userId: string,
  input: AddPantryItemInput,
): Promise<PantryItemDTO> {
  let ingredient;
  try {
    ingredient = await resolveOrCreateIngredient(userId, {
      ingredientId: input.ingredientId,
      name: input.name ?? '',
      category: input.category,
      icon: input.icon,
    });
  } catch (e) {
    if (e instanceof IngredientResolutionError) throw new PantryError(e.message);
    throw e;
  }

  const expiresAt = input.expiresAt ?? null;

  const existing = await getPantryItemByUserAndIngredient(userId, ingredient.id);
  if (existing) {
    const updated = await incrementPantryItemQuantity(existing.id, input.quantity, expiresAt);
    return toPantryItemDTO(updated);
  }

  const created = await createPantryItem({
    userId,
    ingredientId: ingredient.id,
    quantity: input.quantity,
    unit: input.unit,
    expiresAt,
  });

  return toPantryItemDTO(created);
}
