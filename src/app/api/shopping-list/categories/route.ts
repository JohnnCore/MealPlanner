import { NextResponse } from 'next/server';

import { requireApiUserId } from '@/lib/auth-server';
import { getCategoriesByUserId } from '@/server/shopping/queries/category';

/**
 * GET /api/shopping-list/categories
 * Returns all shopping categories for the authenticated user.
 * Writes live in src/actions/shopping/actions.ts (Server Actions).
 */
export async function GET() {
  const userId = await requireApiUserId();
  if (userId instanceof NextResponse) return userId;

  const categories = await getCategoriesByUserId(userId);

  return NextResponse.json(categories);
}
