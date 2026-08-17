import { requireUserId } from '@/lib/auth-server';
import { getShoppingListsByUserId, toShoppingListSummaryDTO } from '@/server/shopping/queries/list';

import { ShoppingListClient } from './ShoppingListClient';

export default async function ShoppingListPage() {
  const userId = await requireUserId();
  const lists = await getShoppingListsByUserId(userId);

  return <ShoppingListClient initialLists={lists.map(toShoppingListSummaryDTO)} />;
}
