import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  addPantryItemAction,
  deletePantryItemAction,
  updatePantryItemAction,
} from '@/actions/pantry/actions';
import { queryKeys } from '@/constants/queryKeys';
import { fetchPantryItems } from '@/lib/api/pantry';
import type {
  CreatePantryItemPayload,
  PantryItemDTO,
  UpdatePantryItemPayload,
} from '@/types/pantry';
import { unwrapAction } from '@/utils/action';

/* ---------------------- query ---------------------- */

export function usePantryItems(initialItems?: PantryItemDTO[]) {
  return useQuery({
    queryKey: queryKeys.pantry.items(),
    queryFn: fetchPantryItems,
    initialData: initialItems,
  });
}

/* ---------------------- mutations ---------------------- */

export function useCreatePantryItem() {
  const qc = useQueryClient();
  const key = queryKeys.pantry.items();

  return useMutation({
    mutationFn: (payload: CreatePantryItemPayload) => unwrapAction(addPantryItemAction(payload)),
    meta: { successMessage: 'Added to pantry', errorMessage: 'Failed to add item' },
    onMutate: async newItem => {
      await qc.cancelQueries({ queryKey: key });
      const prevItems = qc.getQueryData<PantryItemDTO[]>(key);

      const tempId = `temp-${Date.now()}`;

      if (prevItems) {
        const optimistic: PantryItemDTO = {
          id: tempId,
          ingredientId: newItem.ingredientId ?? tempId,
          name: newItem.name ?? '…',
          icon: newItem.icon ?? '🥘',
          category: newItem.category ?? 'OTHER',
          quantity: newItem.quantity,
          unit: newItem.unit,
          expiresAt: newItem.expiresAt ?? null,
          freshnessPercent: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        qc.setQueryData<PantryItemDTO[]>(key, [...prevItems, optimistic]);
      }

      return { prevItems, tempId };
    },
    onSuccess: (created, _vars, ctx) => {
      const items = qc.getQueryData<PantryItemDTO[]>(key);
      if (items && ctx?.tempId) {
        const alreadyHadIngredient = items.some(
          i => i.ingredientId === created.ingredientId && i.id !== ctx.tempId,
        );

        qc.setQueryData<PantryItemDTO[]>(
          key,
          alreadyHadIngredient
            ? // The service incremented an existing row — drop the optimistic temp row
              // and reconcile the real one instead of ending up with two cards for it.
              items.filter(i => i.id !== ctx.tempId).map(i => (i.id === created.id ? created : i))
            : items.map(i => (i.id === ctx.tempId ? created : i)),
        );
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevItems) qc.setQueryData(key, ctx.prevItems);
    },
  });
}

export function useUpdatePantryItem() {
  const qc = useQueryClient();
  const key = queryKeys.pantry.items();

  return useMutation({
    mutationFn: ({ id, ...payload }: UpdatePantryItemPayload & { id: string }) =>
      unwrapAction(updatePantryItemAction(id, payload)),
    // No successMessage: quantity/expiry edits are already visible in the card immediately.
    meta: { errorMessage: 'Failed to update item' },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: key });
      const prevItems = qc.getQueryData<PantryItemDTO[]>(key);

      if (prevItems) {
        qc.setQueryData<PantryItemDTO[]>(
          key,
          prevItems.map(i =>
            i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i,
          ),
        );
      }

      return { prevItems };
    },
    onSuccess: updated => {
      const items = qc.getQueryData<PantryItemDTO[]>(key);
      if (items) {
        qc.setQueryData<PantryItemDTO[]>(
          key,
          items.map(i => (i.id === updated.id ? updated : i)),
        );
      }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevItems) qc.setQueryData(key, ctx.prevItems);
    },
  });
}

export function useDeletePantryItem() {
  const qc = useQueryClient();
  const key = queryKeys.pantry.items();

  return useMutation({
    mutationFn: (id: string) => unwrapAction(deletePantryItemAction(id)),
    meta: { successMessage: 'Removed from pantry', errorMessage: 'Failed to remove item' },
    onMutate: async id => {
      await qc.cancelQueries({ queryKey: key });
      const prevItems = qc.getQueryData<PantryItemDTO[]>(key);

      if (prevItems) {
        qc.setQueryData<PantryItemDTO[]>(
          key,
          prevItems.filter(i => i.id !== id),
        );
      }

      return { prevItems };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevItems) qc.setQueryData(key, ctx.prevItems);
    },
  });
}
