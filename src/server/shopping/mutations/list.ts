import type { ListColor } from '@prisma/client';

import prisma from '@/lib/prisma';

/**
 * Returns the user's default (first) shopping list, creating one if none exists.
 * Throws if the userId doesn't correspond to a real user row (e.g. after a DB reset).
 */
export async function getOrCreateDefaultShoppingList(userId: string) {
  let list = await prisma.shoppingList.findFirst({
    where: { ownerId: userId },
    orderBy: { createdAt: 'asc' },
  });

  if (!list) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    list = await prisma.shoppingList.create({
      data: {
        name: 'My Shopping List',
        ownerId: userId,
      },
    });
  }

  return list;
}

export async function createShoppingList(data: {
  name: string;
  color: ListColor;
  ownerId: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: data.ownerId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  return prisma.shoppingList.create({
    data: {
      name: data.name,
      color: data.color,
      ownerId: data.ownerId,
    },
  });
}

export async function updateShoppingList(id: string, data: { name?: string; color?: ListColor }) {
  return prisma.shoppingList.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.color !== undefined && { color: data.color }),
    },
  });
}

export async function cloneShoppingList(id: string, ownerId: string) {
  const source = await prisma.shoppingList.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!source) throw new Error('LIST_NOT_FOUND');

  return prisma.shoppingList.create({
    data: {
      name: `${source.name} (copy)`,
      color: source.color,
      ownerId,
      items: {
        create: source.items.map(item => ({
          name: item.name,
          categoryId: item.categoryId,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          checked: false,
        })),
      },
    },
  });
}

export async function deleteShoppingList(id: string) {
  return prisma.shoppingList.delete({ where: { id } });
}
