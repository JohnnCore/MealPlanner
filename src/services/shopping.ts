import type { ShoppingListItem } from '@prisma/client';

import type { CreateItemInput } from '@/lib/schemas/shopping';
import {
  clearCheckedItems,
  createItem as createShoppingItem,
} from '@/server/shopping/mutations/item';
import { getOrCreateDefaultShoppingList } from '@/server/shopping/mutations/list';
import { getCategoryByIdAndUser } from '@/server/shopping/queries/category';
import { getCheckedItemsByShoppingListId } from '@/server/shopping/queries/item';
import { getShoppingListByIdAndOwner } from '@/server/shopping/queries/list';
import { IngredientResolutionError, resolveOrCreateIngredient } from '@/services/ingredients';
import { addPantryItem } from '@/services/pantry';
import type { ShoppingListItemDTO } from '@/types/shopping';

/** Expected, user-facing failure — actions surface `message` verbatim. */
export class ShoppingError extends Error {}

/** Resolves the target list: the given id (verifying ownership) or the default list. */
export async function resolveList(userId: string, listId: string | undefined) {
  if (listId) {
    return getShoppingListByIdAndOwner(listId, userId);
  }
  return getOrCreateDefaultShoppingList(userId);
}

export function toItemDTO(item: ShoppingListItem): ShoppingListItemDTO {
  return {
    id: item.id,
    shoppingListId: item.shoppingListId,
    categoryId: item.categoryId,
    ingredientId: item.ingredientId,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes,
    checked: item.checked,
    source: item.source,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

/**
 * Resolves the target list, verifies the category, resolves/creates the ingredient
 * (existing-catalog pick or a new private one), then creates the item. Spans multiple
 * `server/` modules plus the ingredient resolution rule, so it belongs here rather than
 * inlined in the action — mirrors Pantry's `addPantryItem`.
 */
export async function addShoppingItem(
  userId: string,
  input: CreateItemInput,
): Promise<ShoppingListItemDTO> {
  const list = await resolveList(userId, input.listId);
  if (!list) throw new ShoppingError('Shopping list not found');

  const category = await getCategoryByIdAndUser(input.categoryId, userId);
  if (!category) throw new ShoppingError('Category not found');

  let ingredient;
  try {
    ingredient = await resolveOrCreateIngredient(userId, {
      ingredientId: input.ingredientId,
      name: input.name,
      category: input.ingredientCategory,
      icon: input.ingredientIcon,
    });
  } catch (e) {
    if (e instanceof IngredientResolutionError) throw new ShoppingError(e.message);
    throw e;
  }

  const item = await createShoppingItem({
    name: input.name,
    categoryId: input.categoryId,
    quantity: input.quantity ?? 1,
    unit: input.unit,
    notes: input.notes || null,
    shoppingListId: list.id,
    ingredientId: ingredient.id,
  });

  return toItemDTO(item);
}

/**
 * Adds every currently-checked item on the list to the user's Pantry (incrementing an
 * existing pantry row, or creating one — see `services/pantry.ts`'s `addPantryItem`),
 * then clears those items off the shopping list. Legacy items with no `ingredientId`
 * (predating the ingredient-linked add flow) fall back to the `OTHER` category, same as
 * Pantry's own create-new fallback.
 */
export async function completeCheckedItems(
  userId: string,
  listId: string,
): Promise<{ addedCount: number }> {
  const list = await getShoppingListByIdAndOwner(listId, userId);
  if (!list) throw new ShoppingError('Shopping list not found');

  const checkedItems = await getCheckedItemsByShoppingListId(listId);

  for (const item of checkedItems) {
    await addPantryItem(userId, {
      ingredientId: item.ingredientId ?? undefined,
      name: item.ingredientId ? undefined : item.name,
      category: item.ingredientId ? undefined : 'OTHER',
      quantity: item.quantity,
      unit: item.unit,
    });
  }

  await clearCheckedItems(listId);

  return { addedCount: checkedItems.length };
}
