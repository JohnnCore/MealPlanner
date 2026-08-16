import { NextResponse } from 'next/server';

import { requireApiUserId } from '@/lib/auth-server';
import { getOrCreateDefaultShoppingList } from '@/server/shopping/mutations/list';
import { getCategoriesByUserId } from '@/server/shopping/queries/category';
import { getItemsByShoppingListId } from '@/server/shopping/queries/item';
import { getShoppingListByIdAndOwner } from '@/server/shopping/queries/list';

/**
 * GET /api/shopping-list/items?listId=xxx
 * Returns the full shopping list data (items + categories) for the authenticated user.
 * If listId is provided, uses that list; otherwise falls back to the default list.
 * Writes live in src/actions/shopping/actions.ts (Server Actions).
 */
export async function GET(req: Request) {
  const userId = await requireApiUserId();
  if (userId instanceof NextResponse) return userId;

  const { searchParams } = new URL(req.url);
  const listId = searchParams.get('listId');

  let list;
  try {
    if (listId) {
      list = await getShoppingListByIdAndOwner(listId, userId);
      if (!list) {
        return NextResponse.json({ error: 'Shopping list not found' }, { status: 404 });
      }
    } else {
      list = await getOrCreateDefaultShoppingList(userId);
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'USER_NOT_FOUND') {
      return NextResponse.json(
        { error: 'User not found. Please log out and sign in again.' },
        { status: 401 },
      );
    }
    throw e;
  }

  const [categories, items] = await Promise.all([
    getCategoriesByUserId(userId),
    getItemsByShoppingListId(list.id),
  ]);

  return NextResponse.json({
    shoppingListId: list.id,
    categories,
    items,
  });
}
