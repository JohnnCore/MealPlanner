import { NextResponse } from 'next/server';

import { requireApiUserId } from '@/lib/auth-server';
import { getShoppingListsByUserId, toShoppingListSummaryDTO } from '@/server/shopping/queries/list';

/**
 * GET /api/shopping-list
 * Returns all shopping lists for the authenticated user with summary counts.
 * Writes live in src/actions/shopping/actions.ts (Server Actions).
 */
export async function GET() {
  const userId = await requireApiUserId();
  if (userId instanceof NextResponse) return userId;

  const lists = await getShoppingListsByUserId(userId);

  return NextResponse.json(lists.map(toShoppingListSummaryDTO));
}
