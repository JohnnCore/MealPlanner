import prisma from '@/lib/prisma';
import type { ShoppingListSummaryDTO } from '@/types/shopping';

export async function getShoppingListsByUserId(userId: string) {
  return prisma.shoppingList.findMany({
    where: { ownerId: userId },
    include: {
      _count: { select: { items: true } },
      items: { select: { checked: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getShoppingListByIdAndOwner(id: string, ownerId: string) {
  return prisma.shoppingList.findFirst({
    where: { id, ownerId },
  });
}

type ShoppingListWithCounts = Awaited<ReturnType<typeof getShoppingListsByUserId>>[number];

/** Shared shaping used by both the GET /api/shopping-list route and the shopping-list page's Server Component. */
export function toShoppingListSummaryDTO(list: ShoppingListWithCounts): ShoppingListSummaryDTO {
  return {
    id: list.id,
    name: list.name,
    color: list.color,
    itemCount: list._count.items,
    checkedCount: list.items.filter(i => i.checked).length,
    createdAt: list.createdAt.toISOString(),
    updatedAt: list.updatedAt.toISOString(),
  };
}
