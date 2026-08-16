import type { CategoryColor } from '@prisma/client';

import prisma from '@/lib/prisma';

export async function createCategory(data: {
  name: string;
  icon: string;
  color: CategoryColor;
  userId: string;
}) {
  const maxOrder = await prisma.shoppingCategory.aggregate({
    where: { userId: data.userId },
    _max: { sortOrder: true },
  });

  return prisma.shoppingCategory.create({
    data: {
      name: data.name,
      icon: data.icon,
      color: data.color,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      userId: data.userId,
    },
  });
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    icon?: string;
    color?: CategoryColor;
    sortOrder?: number;
  },
) {
  return prisma.shoppingCategory.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.icon !== undefined && { icon: data.icon }),
      ...(data.color !== undefined && { color: data.color }),
      ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
    },
  });
}

export async function deleteCategory(id: string) {
  await prisma.shoppingListItem.deleteMany({ where: { categoryId: id } });
  await prisma.shoppingCategory.delete({ where: { id } });
}
