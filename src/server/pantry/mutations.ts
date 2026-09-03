import type { UnitType } from '@prisma/client';

import prisma from '@/lib/prisma';

export async function createPantryItem(data: {
  userId: string;
  ingredientId: string;
  quantity: number;
  unit: UnitType;
  expiresAt: Date | null;
}) {
  return prisma.pantryItem.create({
    data,
    include: { ingredient: true },
  });
}

export async function incrementPantryItemQuantity(
  id: string,
  addQuantity: number,
  expiresAt: Date | null,
) {
  return prisma.pantryItem.update({
    where: { id },
    data: {
      quantity: { increment: addQuantity },
      expiresAt,
    },
    include: { ingredient: true },
  });
}

export async function updatePantryItem(
  id: string,
  data: { quantity?: number; unit?: UnitType; expiresAt?: Date | null },
) {
  return prisma.pantryItem.update({
    where: { id },
    data: {
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
    },
    include: { ingredient: true },
  });
}

export async function deletePantryItem(id: string) {
  return prisma.pantryItem.delete({ where: { id } });
}
