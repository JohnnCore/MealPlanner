import type { AddPantryItemInput } from '@/lib/schemas/pantry';
import {
  createPantryItem,
  deletePantryItem,
  incrementPantryItemQuantity,
  updatePantryItem,
} from '@/server/pantry/mutations';
import { getPantryItemByUserAndIngredient, toPantryItemDTO } from '@/server/pantry/queries';
import { getRecipeByIdAndAuthor } from '@/server/recipes/queries';
import { IngredientResolutionError, resolveOrCreateIngredient } from '@/services/ingredients';
import type { PantryItemDTO } from '@/types/pantry';
import type { CookRecipeResultDTO } from '@/types/recipes';
import { convertUnit } from '@/utils/unit';

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

/**
 * "Cook" flow, step 3 — after the user confirms they made the recipe, subtract its
 * ingredient quantities from matching pantry rows (deleting a row that hits zero rather
 * than leaving a stale 0-quantity item behind). The recipe's required quantity is
 * converted into the pantry row's own unit first (see `utils/unit.ts`'s `convertUnit`),
 * so e.g. a recipe needing "500 g" correctly subtracts from a pantry row logged in "kg".
 * A row is only left untouched when the two units are from different families entirely
 * (mass vs. volume vs. count) — that conversion isn't possible without per-ingredient
 * density data this app doesn't have.
 *
 * `substitutions` maps a recipe ingredient's id to a *different* pantry ingredient id to
 * consume instead — set when the user picked one of the "possible match" candidates in
 * `CookRecipeDialog` (e.g. the recipe calls for "white rice" but the user confirmed their
 * plain "Rice" pantry row is the one they used).
 *
 * This never fails just because ingredients don't match anything in the pantry — a
 * recipe made from a half-empty (or entirely empty) pantry is a completely normal case,
 * not an error condition. It only throws when the recipe itself doesn't exist/isn't
 * owned by this user. Every other line is either consumed or silently skipped, and the
 * two counts are returned so the caller can tell the user what actually happened instead
 * of a blanket "success".
 */
export async function consumeRecipeIngredients(
  userId: string,
  recipeId: string,
  substitutions: Record<string, string> = {},
): Promise<CookRecipeResultDTO> {
  const recipe = await getRecipeByIdAndAuthor(recipeId, userId);
  if (!recipe) throw new PantryError('Recipe not found');

  let consumedCount = 0;
  let skippedCount = 0;

  for (const line of recipe.ingredients) {
    const targetIngredientId = substitutions[line.ingredientId] ?? line.ingredientId;
    const pantryItem = await getPantryItemByUserAndIngredient(userId, targetIngredientId);
    if (!pantryItem) {
      skippedCount += 1;
      continue;
    }

    const requiredInPantryUnit = convertUnit(line.quantity, line.unit, pantryItem.unit);
    if (requiredInPantryUnit === null) {
      skippedCount += 1;
      continue;
    }

    const remaining = pantryItem.quantity - requiredInPantryUnit;
    if (remaining > 0) {
      await updatePantryItem(pantryItem.id, { quantity: remaining });
    } else {
      await deletePantryItem(pantryItem.id);
    }
    consumedCount += 1;
  }

  return { consumedCount, skippedCount };
}
