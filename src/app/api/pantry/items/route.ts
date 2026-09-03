import { NextResponse } from 'next/server';

import { requireApiUserId } from '@/lib/auth-server';
import { getPantryItemsByUserId, toPantryItemDTO } from '@/server/pantry/queries';

/**
 * GET /api/pantry/items
 * Returns the authenticated user's full pantry. Writes live in
 * src/actions/pantry/actions.ts (Server Actions).
 */
export async function GET() {
  const userId = await requireApiUserId();
  if (userId instanceof NextResponse) return userId;

  const items = await getPantryItemsByUserId(userId);

  return NextResponse.json(items.map(toPantryItemDTO));
}
