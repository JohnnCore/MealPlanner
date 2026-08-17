'use server';

import type { ShoppingListItem } from '@prisma/client';

import type { ActionResult } from '@/lib/actionResult';
import { requireUserId } from '@/lib/auth-server';
import {
  createCategorySchema,
  createItemSchema,
  createListSchema,
  updateCategorySchema,
  updateItemSchema,
  updateListSchema,
} from '@/lib/schemas/shopping';
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '@/server/shopping/mutations/category';
import {
  clearCheckedItems,
  createItem,
  deleteItem,
  updateItem,
} from '@/server/shopping/mutations/item';
import {
  cloneShoppingList,
  createShoppingList,
  deleteShoppingList,
  getOrCreateDefaultShoppingList,
  updateShoppingList,
} from '@/server/shopping/mutations/list';
import { getCategoryByIdAndUser } from '@/server/shopping/queries/category';
import { getItemByIdAndOwner, getItemsByShoppingListId } from '@/server/shopping/queries/item';
import { getShoppingListByIdAndOwner } from '@/server/shopping/queries/list';
import type {
  ShoppingCategoryDTO,
  ShoppingListItemDTO,
  ShoppingListSummaryDTO,
} from '@/types/shopping';

/** Narrower than ShoppingListSummaryDTO — update doesn't touch item/checked counts. */
type ShoppingListPatchDTO = Pick<
  ShoppingListSummaryDTO,
  'id' | 'name' | 'color' | 'createdAt' | 'updatedAt'
>;

/* ---------------------- Shopping Lists ---------------------- */

export async function createListAction(
  input: unknown,
): Promise<ActionResult<ShoppingListSummaryDTO>> {
  const userId = await requireUserId();

  const parsed = createListSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid list data' };

  try {
    const list = await createShoppingList({
      name: parsed.data.name,
      color: parsed.data.color ?? 'PRIMARY',
      ownerId: userId,
    });

    return {
      success: true,
      data: {
        id: list.id,
        name: list.name,
        color: list.color,
        itemCount: 0,
        checkedCount: 0,
        createdAt: list.createdAt.toISOString(),
        updatedAt: list.updatedAt.toISOString(),
      },
    };
  } catch (e) {
    if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
      return { error: 'User not found. Please log out and sign in again.' };
    }
    throw e;
  }
}

export async function updateListAction(
  id: string,
  input: unknown,
): Promise<ActionResult<ShoppingListPatchDTO>> {
  const userId = await requireUserId();

  const parsed = updateListSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid list data' };

  const list = await getShoppingListByIdAndOwner(id, userId);
  if (!list) return { error: 'Not found' };

  const updated = await updateShoppingList(id, parsed.data);

  return {
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      color: updated.color,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function cloneListAction(id: string): Promise<ActionResult<ShoppingListSummaryDTO>> {
  const userId = await requireUserId();

  const list = await getShoppingListByIdAndOwner(id, userId);
  if (!list) return { error: 'Not found' };

  const cloned = await cloneShoppingList(id, userId);
  const clonedItems = await getItemsByShoppingListId(cloned.id);

  return {
    success: true,
    data: {
      id: cloned.id,
      name: cloned.name,
      color: cloned.color,
      itemCount: clonedItems.length,
      checkedCount: 0,
      createdAt: cloned.createdAt.toISOString(),
      updatedAt: cloned.updatedAt.toISOString(),
    },
  };
}

export async function deleteListAction(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();

  const list = await getShoppingListByIdAndOwner(id, userId);
  if (!list) return { error: 'Not found' };

  await deleteShoppingList(id);
  return { success: true, data: null };
}

/* ---------------------- Categories ---------------------- */

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<ShoppingCategoryDTO>> {
  const userId = await requireUserId();

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid category data' };

  const category = await createCategory({
    name: parsed.data.name,
    icon: parsed.data.icon,
    color: parsed.data.color,
    userId,
  });

  return {
    success: true,
    data: {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    },
  };
}

export async function updateCategoryAction(
  id: string,
  input: unknown,
): Promise<ActionResult<ShoppingCategoryDTO>> {
  const userId = await requireUserId();

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid category data' };

  const existing = await getCategoryByIdAndUser(id, userId);
  if (!existing) return { error: 'Category not found' };

  const updated = await updateCategory(id, parsed.data);

  return {
    success: true,
    data: {
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      color: updated.color,
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    },
  };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();

  const existing = await getCategoryByIdAndUser(id, userId);
  if (!existing) return { error: 'Category not found' };

  await deleteCategory(id);
  return { success: true, data: null };
}

/* ---------------------- Items ---------------------- */

async function resolveList(userId: string, listId: string | undefined) {
  if (listId) {
    const list = await getShoppingListByIdAndOwner(listId, userId);
    return list;
  }
  return getOrCreateDefaultShoppingList(userId);
}

function toItemDTO(item: ShoppingListItem): ShoppingListItemDTO {
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

export async function createItemAction(input: unknown): Promise<ActionResult<ShoppingListItemDTO>> {
  const userId = await requireUserId();

  const parsed = createItemSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid item data' };

  let list;
  try {
    list = await resolveList(userId, parsed.data.listId);
  } catch (e) {
    if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
      return { error: 'User not found. Please log out and sign in again.' };
    }
    throw e;
  }
  if (!list) return { error: 'Shopping list not found' };

  const category = await getCategoryByIdAndUser(parsed.data.categoryId, userId);
  if (!category) return { error: 'Category not found' };

  const item = await createItem({
    name: parsed.data.name,
    categoryId: parsed.data.categoryId,
    quantity: parsed.data.quantity ?? 1,
    unit: parsed.data.unit,
    notes: parsed.data.notes || null,
    shoppingListId: list.id,
  });

  return { success: true, data: toItemDTO(item) };
}

export async function updateItemAction(
  id: string,
  input: unknown,
): Promise<ActionResult<ShoppingListItemDTO>> {
  const userId = await requireUserId();

  const parsed = updateItemSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid item data' };

  const existing = await getItemByIdAndOwner(id, userId);
  if (!existing) return { error: 'Item not found' };

  const updated = await updateItem(id, {
    ...parsed.data,
    notes: parsed.data.notes === undefined ? undefined : parsed.data.notes || null,
  });

  return { success: true, data: toItemDTO(updated) };
}

export async function deleteItemAction(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();

  const existing = await getItemByIdAndOwner(id, userId);
  if (!existing) return { error: 'Item not found' };

  await deleteItem(id);
  return { success: true, data: null };
}

export async function clearCheckedItemsAction(
  listId: string | undefined,
): Promise<ActionResult<{ deletedCount: number }>> {
  const userId = await requireUserId();

  const list = await resolveList(userId, listId);
  if (!list) return { error: 'Shopping list not found' };

  const deletedCount = await clearCheckedItems(list.id);
  return { success: true, data: { deletedCount } };
}
