import type { UnitType } from '@prisma/client';

import prisma from '@/lib/prisma';

export async function createItem(data: {
  name: string;
  categoryId: string;
  quantity: number;
  unit: UnitType;
  notes: string | null;
  shoppingListId: string;
  ingredientId: string;
}) {
  return prisma.shoppingListItem.create({
    data: {
      name: data.name,
      categoryId: data.categoryId,
      quantity: data.quantity,
      unit: data.unit,
      notes: data.notes,
      shoppingListId: data.shoppingListId,
      ingredientId: data.ingredientId,
    },
  });
}

export async function updateItem(
  id: string,
  data: {
    name?: string;
    categoryId?: string;
    quantity?: number;
    unit?: UnitType;
    notes?: string | null;
    checked?: boolean;
  },
) {
  return prisma.shoppingListItem.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.checked !== undefined && { checked: data.checked }),
    },
  });
}

export async function deleteItem(id: string) {
  return prisma.shoppingListItem.delete({ where: { id } });
}

export async function clearCheckedItems(shoppingListId: string) {
  const result = await prisma.shoppingListItem.deleteMany({
    where: {
      shoppingListId,
      checked: true,
    },
  });
  return result.count;
}
