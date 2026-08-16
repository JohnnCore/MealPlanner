import type {
  ShoppingCategoryDTO,
  ShoppingListData,
  ShoppingListSummaryDTO,
} from '@/types/shopping';

/**
 * Reads only — mutations are Server Actions (see src/actions/shopping/actions.ts).
 * These stay fetch-based because useQuery needs a fetchable queryFn for caching/refetch.
 */

export async function fetchShoppingLists(): Promise<ShoppingListSummaryDTO[]> {
  const res = await fetch('/api/shopping-list');
  if (!res.ok) throw new Error('Failed to fetch shopping lists');
  return res.json();
}

export async function fetchCategories(): Promise<ShoppingCategoryDTO[]> {
  const res = await fetch('/api/shopping-list/categories');
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchShoppingList(listId?: string): Promise<ShoppingListData> {
  const url = listId ? `/api/shopping-list/items?listId=${listId}` : '/api/shopping-list/items';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch shopping list');
  return res.json();
}
