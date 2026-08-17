import prisma from '@/lib/prisma';

export async function getItemsByShoppingListId(shoppingListId: string) {
  return prisma.shoppingListItem.findMany({
    where: { shoppingListId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getItemByIdAndOwner(id: string, ownerId: string) {
  return prisma.shoppingListItem.findFirst({
    where: {
      id,
      shoppingList: { ownerId },
    },
  });
}
