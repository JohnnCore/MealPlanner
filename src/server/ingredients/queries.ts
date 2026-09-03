import type { Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';

/**
 * The single reusable ingredient-visibility rule: a user can see the shared/global
 * catalog (`createdByUserId: null`) plus their own private additions. Every read AND
 * write that touches an `Ingredient` by id or by search must go through this — it's
 * the only thing standing between a user's private (possibly offensive/junk) custom
 * ingredient and every other user's search results.
 */
export function ingredientVisibilityFilter(userId: string): Prisma.IngredientWhereInput {
  return { OR: [{ createdByUserId: null }, { createdByUserId: userId }] };
}

export async function searchIngredients(userId: string, query: string, limit = 20) {
  return prisma.ingredient.findMany({
    where: {
      ...ingredientVisibilityFilter(userId),
      name: { contains: query, mode: 'insensitive' },
    },
    orderBy: { name: 'asc' },
    take: limit,
  });
}

export async function getVisibleIngredientById(id: string, userId: string) {
  return prisma.ingredient.findFirst({
    where: { id, ...ingredientVisibilityFilter(userId) },
  });
}

export async function findVisibleIngredientByName(name: string, userId: string) {
  return prisma.ingredient.findFirst({
    where: {
      ...ingredientVisibilityFilter(userId),
      name: { equals: name, mode: 'insensitive' },
    },
  });
}
