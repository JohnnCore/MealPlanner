import type { IngredientCategory } from '@prisma/client';

import prisma from '@/lib/prisma';
import { findVisibleIngredientByName } from '@/server/ingredients/queries';

/**
 * Reuses a case-insensitive match within the user's visible scope (global or their own)
 * if one exists, otherwise creates a new ingredient scoped privately to this user —
 * user-created ingredients never land in the shared (`createdByUserId: null`) bucket.
 */
export async function findOrCreateIngredientForUser(
  userId: string,
  data: { name: string; category: IngredientCategory; icon: string },
) {
  const existing = await findVisibleIngredientByName(data.name, userId);
  if (existing) return existing;

  return prisma.ingredient.create({
    data: {
      name: data.name,
      category: data.category,
      icon: data.icon,
      createdByUserId: userId,
    },
  });
}
