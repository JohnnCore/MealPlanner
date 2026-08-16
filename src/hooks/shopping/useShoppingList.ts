import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  cloneListAction,
  createListAction,
  deleteListAction,
  updateListAction,
} from '@/actions/shopping/actions';
import { unwrapAction } from '@/lib/actionResult';
import { fetchShoppingLists } from '@/lib/api/shopping';
import { queryKeys } from '@/lib/queryKeys';
import type {
  CreateListPayload,
  ShoppingListSummaryDTO,
  UpdateListPayload,
} from '@/types/shopping';

/* ---------------------- query ---------------------- */

export function useShoppingLists(initialLists?: ShoppingListSummaryDTO[]) {
  return useQuery({
    queryKey: queryKeys.shopping.lists(),
    queryFn: fetchShoppingLists,
    initialData: initialLists,
  });
}

/* ---------------------- mutations ------------------------------ */
export function useCreateList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateListPayload) => unwrapAction(createListAction(payload)),
    meta: { successMessage: 'List created', errorMessage: 'Failed to create list' },
    onMutate: async newList => {
      await qc.cancelQueries({ queryKey: queryKeys.shopping.lists() });
      const prevLists = qc.getQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists());

      const tempId = `temp-${Date.now()}`;

      if (prevLists) {
        const optimistic: ShoppingListSummaryDTO = {
          id: tempId,
          name: newList.name,
          color: newList.color,
          itemCount: 0,
          checkedCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        qc.setQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists(), [
          ...prevLists,
          optimistic,
        ]);
      }

      return { prevLists, tempId };
    },
    onSuccess: (created, _vars, ctx) => {
      // Swap the temp list for the real server response
      const lists = qc.getQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists());
      if (lists && ctx?.tempId) {
        qc.setQueryData<ShoppingListSummaryDTO[]>(
          queryKeys.shopping.lists(),
          lists.map(l => (l.id === ctx.tempId ? created : l)),
        );
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}

export function useUpdateList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateListPayload & { id: string }) =>
      unwrapAction(updateListAction(id, payload)),
    // No successMessage: renaming/recoloring a list is already visible in the UI immediately.
    meta: { errorMessage: 'Failed to update list' },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: queryKeys.shopping.lists() });
      const prevLists = qc.getQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists());

      if (prevLists) {
        qc.setQueryData<ShoppingListSummaryDTO[]>(
          queryKeys.shopping.lists(),
          prevLists.map(l =>
            l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l,
          ),
        );
      }

      return { prevLists };
    },
    onSuccess: updated => {
      // Reconcile with server response
      const lists = qc.getQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists());
      if (lists) {
        qc.setQueryData<ShoppingListSummaryDTO[]>(
          queryKeys.shopping.lists(),
          lists.map(l => (l.id === updated.id ? { ...l, ...updated } : l)),
        );
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}

export function useCloneList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unwrapAction(cloneListAction(id)),
    meta: { successMessage: 'List cloned', errorMessage: 'Failed to clone list' },
    onSuccess: cloned => {
      // Append the cloned list to the cache
      const lists = qc.getQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists());
      if (lists) {
        qc.setQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists(), [...lists, cloned]);
      }
    },
  });
}

export function useDeleteList() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => unwrapAction(deleteListAction(id)),
    meta: { successMessage: 'List deleted', errorMessage: 'Failed to delete list' },
    onMutate: async id => {
      await qc.cancelQueries({ queryKey: queryKeys.shopping.lists() });
      const prevLists = qc.getQueryData<ShoppingListSummaryDTO[]>(queryKeys.shopping.lists());

      if (prevLists) {
        qc.setQueryData<ShoppingListSummaryDTO[]>(
          queryKeys.shopping.lists(),
          prevLists.filter(l => l.id !== id),
        );
      }

      // Also remove the cached list detail data
      qc.removeQueries({ queryKey: queryKeys.shopping.list(id) });

      return { prevLists };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevLists) qc.setQueryData(queryKeys.shopping.lists(), ctx.prevLists);
    },
  });
}
