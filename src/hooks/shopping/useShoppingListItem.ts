import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  clearCheckedItemsAction,
  completeCheckedItemsAction,
  createItemAction,
  deleteItemAction,
  updateItemAction,
} from '@/actions/shopping/actions';
import { queryKeys } from '@/constants/queryKeys';
import { fetchShoppingList } from '@/lib/api/shopping';
import type {
  CreateItemPayload,
  ShoppingListData,
  ShoppingListItemDTO,
  ShoppingListSummaryDTO,
  UpdateItemPayload,
} from '@/types/shopping';
import { unwrapAction } from '@/utils/action';

/* ---------------------- helpers ---------------------- */

/**
 * Optimistically patch a single list's summary counts.
 * Returns the previous lists snapshot for rollback.
 */
function patchListCounts(
  qc: ReturnType<typeof useQueryClient>,
  listId: string | undefined,
  updater: (list: ShoppingListSummaryDTO) => ShoppingListSummaryDTO,
) {
  const listsKey = queryKeys.shopping.lists();
  const prev = qc.getQueryData<ShoppingListSummaryDTO[]>(listsKey);

  if (prev && listId) {
    qc.setQueryData<ShoppingListSummaryDTO[]>(
      listsKey,
      prev.map(l => (l.id === listId ? updater(l) : l)),
    );
  }

  return prev;
}

/* ---------------------- query ---------------------- */

export function useShoppingListItems(listId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.shopping.list(listId ?? ''),
    queryFn: () => fetchShoppingList(listId),
    enabled: !!listId,
  });
}

/* ---------------------- mutations ---------------------- */

export function useCreateItem(listId: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.shopping.list(listId ?? '');

  return useMutation({
    mutationFn: (payload: CreateItemPayload) =>
      unwrapAction(createItemAction({ ...payload, listId })),
    meta: { successMessage: 'Item added', errorMessage: 'Failed to add item' },
    onMutate: async newItem => {
      await qc.cancelQueries({ queryKey: key });
      const prevList = qc.getQueryData<ShoppingListData>(key);

      const tempId = `temp-${Date.now()}`;

      if (prevList) {
        const optimistic: ShoppingListItemDTO = {
          id: tempId,
          shoppingListId: prevList.shoppingListId,
          categoryId: newItem.categoryId,
          ingredientId: null,
          name: newItem.name,
          quantity: newItem.quantity,
          unit: newItem.unit,
          notes: newItem.notes ?? null,
          checked: false,
          source: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        qc.setQueryData<ShoppingListData>(key, {
          ...prevList,
          items: [...prevList.items, optimistic],
        });
      }

      const prevLists = patchListCounts(qc, listId, l => ({
        ...l,
        itemCount: l.itemCount + 1,
      }));

      return { prevList, prevLists, tempId };
    },
    onSuccess: (created, _vars, ctx) => {
      // Swap the temp item for the real server response (real id, timestamps, etc.)
      const list = qc.getQueryData<ShoppingListData>(key);
      if (list && ctx?.tempId) {
        qc.setQueryData<ShoppingListData>(key, {
          ...list,
          items: list.items.map(i => (i.id === ctx.tempId ? created : i)),
        });
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(key, ctx.prevList);
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}

/**
 * Adds an item to the user's default shopping list from a context that doesn't have a
 * specific list open (e.g. the recipe "Cook" dialog) — `createItemAction` resolves the
 * default list server-side when no `listId` is given. Unlike `useCreateItem`, this isn't
 * scoped to one list's cache key up front (the target list isn't known until the mutation
 * resolves), so it invalidates by the real `shoppingListId` the server returns instead of
 * applying an optimistic update.
 */
export function useQuickAddToShoppingList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateItemPayload) => unwrapAction(createItemAction(payload)),
    meta: { successMessage: 'Added to shopping list', errorMessage: 'Failed to add item' },
    onSuccess: created => {
      void qc.invalidateQueries({ queryKey: queryKeys.shopping.list(created.shoppingListId) });
      void qc.invalidateQueries({ queryKey: queryKeys.shopping.lists() });
    },
  });
}

export function useUpdateItem(listId: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.shopping.list(listId ?? '');

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateItemPayload & { id: string }) =>
      unwrapAction(updateItemAction(id, payload)),
    // No successMessage: this only backs the checkbox toggle today — a toast per
    // checked item would be noisy. Add one back if this starts backing an edit dialog too.
    meta: { errorMessage: 'Failed to update item' },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: key });
      const prevList = qc.getQueryData<ShoppingListData>(key);

      // Track checked delta for list summary counts
      let checkedDelta = 0;
      if (prevList && updates.checked !== undefined) {
        const item = prevList.items.find(i => i.id === id);
        if (item && item.checked !== updates.checked) {
          checkedDelta = updates.checked ? 1 : -1;
        }
      }

      if (prevList) {
        qc.setQueryData<ShoppingListData>(key, {
          ...prevList,
          items: prevList.items.map(i =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i,
          ),
        });
      }

      const prevLists =
        checkedDelta !== 0
          ? patchListCounts(qc, listId, l => ({
              ...l,
              checkedCount: l.checkedCount + checkedDelta,
            }))
          : undefined;

      return { prevList, prevLists };
    },
    onSuccess: updated => {
      // Reconcile with the real server response
      const list = qc.getQueryData<ShoppingListData>(key);
      if (list) {
        qc.setQueryData<ShoppingListData>(key, {
          ...list,
          items: list.items.map(i => (i.id === updated.id ? updated : i)),
        });
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(key, ctx.prevList);
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}

export function useDeleteItem(listId: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.shopping.list(listId ?? '');

  return useMutation({
    mutationFn: (id: string) => unwrapAction(deleteItemAction(id)),
    meta: { successMessage: 'Item removed', errorMessage: 'Failed to remove item' },
    onMutate: async id => {
      await qc.cancelQueries({ queryKey: key });
      const prevList = qc.getQueryData<ShoppingListData>(key);

      // Find the item before removing so we can adjust list counts
      const item = prevList?.items.find(i => i.id === id);

      if (prevList) {
        qc.setQueryData<ShoppingListData>(key, {
          ...prevList,
          items: prevList.items.filter(i => i.id !== id),
        });
      }

      const prevLists = patchListCounts(qc, listId, l => ({
        ...l,
        itemCount: l.itemCount - 1,
        checkedCount: item?.checked ? l.checkedCount - 1 : l.checkedCount,
      }));

      return { prevList, prevLists };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(key, ctx.prevList);
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}

export function useClearCheckedItems(listId: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.shopping.list(listId ?? '');

  return useMutation({
    mutationFn: () => unwrapAction(clearCheckedItemsAction(listId)),
    meta: {
      successMessage: 'Checked items cleared',
      errorMessage: 'Failed to clear checked items',
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prevList = qc.getQueryData<ShoppingListData>(key);

      const checkedCount = prevList?.items.filter(i => i.checked).length ?? 0;

      if (prevList) {
        qc.setQueryData<ShoppingListData>(key, {
          ...prevList,
          items: prevList.items.filter(i => !i.checked),
        });
      }

      const prevLists = patchListCounts(qc, listId, l => ({
        ...l,
        itemCount: l.itemCount - checkedCount,
        checkedCount: 0,
      }));

      return { prevList, prevLists };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(key, ctx.prevList);
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}

/**
 * Adds every checked item to the user's Pantry (see services/shopping.ts's
 * completeCheckedItems), then clears them off the list — same optimistic-clear shape as
 * useClearCheckedItems, plus invalidating the Pantry items query since new rows exist there.
 */
export function useCompleteCheckedItems(listId: string | undefined) {
  const qc = useQueryClient();
  const key = queryKeys.shopping.list(listId ?? '');

  return useMutation({
    mutationFn: () => {
      if (!listId) throw new Error('No shopping list selected');
      return unwrapAction(completeCheckedItemsAction(listId));
    },
    meta: {
      successMessage: 'Added to pantry',
      errorMessage: 'Failed to add items to pantry',
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: key });
      const prevList = qc.getQueryData<ShoppingListData>(key);

      const checkedCount = prevList?.items.filter(i => i.checked).length ?? 0;

      if (prevList) {
        qc.setQueryData<ShoppingListData>(key, {
          ...prevList,
          items: prevList.items.filter(i => !i.checked),
        });
      }

      const prevLists = patchListCounts(qc, listId, l => ({
        ...l,
        itemCount: l.itemCount - checkedCount,
        checkedCount: 0,
      }));

      return { prevList, prevLists };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pantry.items() });
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevList) qc.setQueryData(key, ctx.prevList);
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}
