import { NextResponse } from 'next/server';

import { requireApiUserId } from '@/lib/auth-server';
import { searchIngredients } from '@/server/ingredients/queries';
import type { IngredientSearchResultDTO } from '@/types/ingredients';

const SEARCH_LIMIT = 20;

/**
 * GET /api/ingredients/search?q=xxx
 * Searches the ingredient catalog scoped to what this user can see (shared catalog
 * plus their own private additions) — see `ingredientVisibilityFilter`.
 */
export async function GET(req: Request) {
  const userId = await requireApiUserId();
  if (userId instanceof NextResponse) return userId;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim() ?? '';

  if (!query) return NextResponse.json([]);

  const results = await searchIngredients(userId, query, SEARCH_LIMIT);

  const dto: IngredientSearchResultDTO[] = results.map(i => ({
    id: i.id,
    name: i.name,
    icon: i.icon,
    category: i.category,
  }));

  return NextResponse.json(dto);
}
