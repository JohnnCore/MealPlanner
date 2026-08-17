import prisma from '@/lib/prisma';

export async function getCategoriesByUserId(userId: string) {
  return prisma.shoppingCategory.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getCategoryByIdAndUser(id: string, userId: string) {
  return prisma.shoppingCategory.findFirst({
    where: { id, userId },
  });
}
