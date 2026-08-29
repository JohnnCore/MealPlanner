import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from '@/actions/shopping/actions';
import { queryKeys } from '@/constants/queryKeys';
import { fetchCategories } from '@/lib/api/shopping';
import type {
  CreateCategoryPayload,
  ShoppingCategoryDTO,
  ShoppingListData,
  ShoppingListSummaryDTO,
  UpdateCategoryPayload,
} from '@/types/shopping';
import { unwrapAction } from '@/utils/action';

/* ---------------------- query ---------------------- */

export function useShoppingCategories() {
  return useQuery({
    queryKey: queryKeys.shopping.categories(),
    queryFn: fetchCategories,
  });
}

/* ---------------------- mutations ---------------------- */

export function useCreateCategory(listId: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.shopping.list(listId ?? '');

  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => unwrapAction(createCategoryAction(payload)),
    meta: { successMessage: 'Category created', errorMessage: 'Failed to create category' },
    onMutate: async newCategory => {
      await qc.cancelQueries({ queryKey: key });
      await qc.cancelQueries({ queryKey: queryKeys.shopping.categories() });

      const prevList = qc.getQueryData<ShoppingListData>(key);
      const prevCats = qc.getQueryData<ShoppingCategoryDTO[]>(queryKeys.shopping.categories());

      const tempId = `temp-${Date.now()}`;
      const optimistic: ShoppingCategoryDTO = {
        id: tempId,
        name: newCategory.name,
        icon: newCategory.icon,
        color: newCategory.color,
        sortOrder: prevList?.categories.length ?? prevCats?.length ?? 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (prevList) {
        qc.setQueryData<ShoppingListData>(key, {
          ...prevList,
          categories: [...prevList.categories, optimistic],
        });
      }

      if (prevCats) {
        qc.setQueryData<ShoppingCategoryDTO[]>(queryKeys.shopping.categories(), [
          ...prevCats,
          optimistic,
        ]);
      }

      return { prevList, prevCats, tempId };
    },
    onSuccess: (created, _vars, ctx) => {
      // Swap the temp category for the real server response in both caches
      if (ctx?.tempId) {
        const list = qc.getQueryData<ShoppingListData>(key);
        if (list) {
          qc.setQueryData<ShoppingListData>(key, {
            ...list,
            categories: list.categories.map(c => (c.id === ctx.tempId ? created : c)),
          });
        }

        const cats = qc.getQueryData<ShoppingCategoryDTO[]>(queryKeys.shopping.categories());
        if (cats) {
          qc.setQueryData<ShoppingCategoryDTO[]>(
            queryKeys.shopping.categories(),
            cats.map(c => (c.id === ctx.tempId ? created : c)),
          );
        }
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(key, ctx.prevList);
      if (ctx?.prevCats) qc.setQueryData(queryKeys.shopping.categories(), ctx.prevCats);
    },
  });
}

export function useUpdateCategory(listId: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.shopping.list(listId ?? '');

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateCategoryPayload & { id: string }) =>
      unwrapAction(updateCategoryAction(id, payload)),
    // No successMessage: category edits are already visible in the dialog/list immediately.
    meta: { errorMessage: 'Failed to update category' },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: key });
      await qc.cancelQueries({ queryKey: queryKeys.shopping.categories() });

      const prevList = qc.getQueryData<ShoppingListData>(key);
      const prevCats = qc.getQueryData<ShoppingCategoryDTO[]>(queryKeys.shopping.categories());

      if (prevList) {
        qc.setQueryData<ShoppingListData>(key, {
          ...prevList,
          categories: prevList.categories.map(c => (c.id === id ? { ...c, ...updates } : c)),
        });
      }

      if (prevCats) {
        qc.setQueryData<ShoppingCategoryDTO[]>(
          queryKeys.shopping.categories(),
          prevCats.map(c => (c.id === id ? { ...c, ...updates } : c)),
        );
      }

      return { prevList, prevCats };
    },
    onSuccess: updated => {
      // Reconcile both caches with the real server response
      const list = qc.getQueryData<ShoppingListData>(key);
      if (list) {
        qc.setQueryData<ShoppingListData>(key, {
          ...list,
          categories: list.categories.map(c => (c.id === updated.id ? updated : c)),
        });
      }

      const cats = qc.getQueryData<ShoppingCategoryDTO[]>(queryKeys.shopping.categories());
      if (cats) {
        qc.setQueryData<ShoppingCategoryDTO[]>(
          queryKeys.shopping.categories(),
          cats.map(c => (c.id === updated.id ? updated : c)),
        );
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(key, ctx.prevList);
      if (ctx?.prevCats) qc.setQueryData(queryKeys.shopping.categories(), ctx.prevCats);
    },
  });
}

export function useDeleteCategory(listId: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.shopping.list(listId ?? '');

  return useMutation({
    mutationFn: (id: string) => unwrapAction(deleteCategoryAction(id)),
    meta: { successMessage: 'Category deleted', errorMessage: 'Failed to delete category' },
    onMutate: async id => {
      await qc.cancelQueries({ queryKey: queryKeys.shopping.all });

      const prevList = qc.getQueryData<ShoppingListData>(key);
      const prevCats = qc.getQueryData<ShoppingCategoryDTO[]>(queryKeys.shopping.categories());
      const prevLists = qc.getQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists());

      // Count removed items from active list to adjust summary counts
      const removedItems = prevList?.items.filter(i => i.categoryId === id) ?? [];
      const removedChecked = removedItems.filter(i => i.checked).length;

      // 1) Remove category + its items from active list cache
      if (prevList) {
        qc.setQueryData<ShoppingListData>(key, {
          ...prevList,
          categories: prevList.categories.filter(c => c.id !== id),
          items: prevList.items.filter(i => i.categoryId !== id),
        });
      }

      // 2) Remove category from the categories cache
      if (prevCats) {
        qc.setQueryData<ShoppingCategoryDTO[]>(
          queryKeys.shopping.categories(),
          prevCats.filter(c => c.id !== id),
        );
      }

      // 3) Adjust active list counts in the lists summary
      if (prevLists && listId) {
        qc.setQueryData<ShoppingListSummaryDTO[]>(
          queryKeys.shopping.lists(),
          prevLists.map(l =>
            l.id === listId
              ? {
                  ...l,
                  itemCount: l.itemCount - removedItems.length,
                  checkedCount: l.checkedCount - removedChecked,
                }
              : l,
          ),
        );
      }

      return { prevList, prevCats, prevLists };
    },
    onSuccess: (_data, deletedCategoryId) => {
      // Scrub items for the deleted category from ALL cached lists (not just active)
      const allListQueries = qc.getQueriesData<ShoppingListData>({
        queryKey: queryKeys.shopping.all,
      });

      for (const [queryKey, data] of allListQueries) {
        // Only patch list-detail caches (shape: { shoppingListId, items, categories })
        if (!data || !('items' in data)) continue;
        // Skip the active list — already patched in onMutate
        if (queryKey.toString() === key.toString()) continue;

        const removedItems = data.items.filter(i => i.categoryId === deletedCategoryId);
        if (removedItems.length === 0) continue;

        qc.setQueryData<ShoppingListData>(queryKey, {
          ...data,
          categories: data.categories.filter(c => c.id !== deletedCategoryId),
          items: data.items.filter(i => i.categoryId !== deletedCategoryId),
        });

        // Also adjust that list's summary counts
        const removedChecked = removedItems.filter(i => i.checked).length;
        const otherListId = data.shoppingListId;
        const lists = qc.getQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists());
        if (lists) {
          qc.setQueryData<ShoppingListSummaryDTO[]>(
            queryKeys.shopping.lists(),
            lists.map(l =>
              l.id === otherListId
                ? {
                    ...l,
                    itemCount: l.itemCount - removedItems.length,
                    checkedCount: l.checkedCount - removedChecked,
                  }
                : l,
            ),
          );
        }
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(key, ctx.prevList);
      if (ctx?.prevCats) qc.setQueryData(queryKeys.shopping.categories(), ctx.prevCats);
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}
