import type { Ingredient, PantryItem } from '@prisma/client';

import prisma from '@/lib/prisma';
import type { PantryItemDTO } from '@/types/pantry';
import { calculateFreshnessPercent } from '@/utils/pantry';

type PantryItemWithIngredient = PantryItem & { ingredient: Ingredient };

export function toPantryItemDTO(item: PantryItemWithIngredient): PantryItemDTO {
  return {
    id: item.id,
    ingredientId: item.ingredientId,
    name: item.ingredient.name,
    icon: item.ingredient.icon,
    category: item.ingredient.category,
    quantity: item.quantity,
    unit: item.unit,
    expiresAt: item.expiresAt ? item.expiresAt.toISOString() : null,
    freshnessPercent: calculateFreshnessPercent(item.expiresAt),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

export async function getPantryItemsByUserId(userId: string) {
  return prisma.pantryItem.findMany({
    where: { userId },
    include: { ingredient: true },
    orderBy: { ingredient: { name: 'asc' } },
  });
}

export async function getPantryItemByIdAndUser(id: string, userId: string) {
  return prisma.pantryItem.findFirst({
    where: { id, userId },
    include: { ingredient: true },
  });
}

export async function getPantryItemByUserAndIngredient(userId: string, ingredientId: string) {
  return prisma.pantryItem.findUnique({
    where: { userId_ingredientId: { userId, ingredientId } },
    include: { ingredient: true },
  });
}
