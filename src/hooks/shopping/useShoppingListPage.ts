'use client';

import { useCallback, useMemo, useState } from 'react';

import type {
  ShoppingCategoryDTO,
  ShoppingListItemDTO,
  ShoppingListSummaryDTO,
} from '@/types/shopping';

import { useCloneList, useShoppingLists } from './useShoppingList';
import {
  useClearCheckedItems,
  useDeleteItem,
  useShoppingListItems,
  useUpdateItem,
} from './useShoppingListItem';

/**
 * Page-level orchestrator for the Shopping List page.
 * Composes feature hooks and exposes derived state + handlers.
 */
export function useShoppingListPage(initialLists?: ShoppingListSummaryDTO[]) {
  /* -- List-level state -- */
  const [selectedListId, setSelectedListId] = useState<string | undefined>(undefined);
  const { data: lists, isLoading: isLoadingLists } = useShoppingLists(initialLists);

  // Auto-select first list once loaded
  const activeListId = selectedListId ?? lists?.[0]?.id;
  const activeList: ShoppingListSummaryDTO | undefined = lists?.find(l => l.id === activeListId);

  /* -- List-level mutations -- */
  const cloneList = useCloneList();

  /* -- Feature hooks (per-list) -- */
  const { data, isLoading: isLoadingItems } = useShoppingListItems(activeListId);
  const updateItem = useUpdateItem(activeListId);
  const deleteItem = useDeleteItem(activeListId);
  const clearChecked = useClearCheckedItems(activeListId);

  /* -- Dialog state -- */
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingListSummaryDTO | null>(null);
  const [deletingList, setDeletingList] = useState<ShoppingListSummaryDTO | null>(null);
  const [editingCategory, setEditingCategory] = useState<ShoppingCategoryDTO | null>(null);

  /* -- Derived data -- */
  const categories = data?.categories ?? [];
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const totalItems = items.length;
  const checkedItems = items.filter(i => i.checked).length;
  const progressPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, ShoppingListItemDTO[]>();
    for (const item of items) {
      const arr = map.get(item.categoryId) ?? [];
      arr.push(item);
      map.set(item.categoryId, arr);
    }
    return map;
  }, [items]);

  const activeCategories = categories.filter(c => itemsByCategory.has(c.id));

  /* -- Handlers -- */
  const handleSelectList = useCallback((listId: string) => {
    setSelectedListId(listId);
  }, []);

  const handleEditList = useCallback((list: ShoppingListSummaryDTO) => {
    setEditingList(list);
    setCreateListOpen(true);
  }, []);

  const handleCloneList = useCallback(
    (listId: string) => {
      cloneList.mutate(listId, {
        onSuccess: data => setSelectedListId(data.id),
      });
    },
    [cloneList],
  );

  const handleDeleteListRequest = useCallback((list: ShoppingListSummaryDTO) => {
    setDeletingList(list);
  }, []);

  const handleDeleteListConfirmed = useCallback(
    (listId: string) => {
      if (listId === activeListId) setSelectedListId(undefined);
      setDeletingList(null);
    },
    [activeListId],
  );

  const handleCreateListOpenChange = useCallback((open: boolean) => {
    setCreateListOpen(open);
    if (!open) setEditingList(null);
  }, []);

  const handleToggleItem = useCallback(
    (item: ShoppingListItemDTO) => {
      updateItem.mutate({ id: item.id, checked: !item.checked });
    },
    [updateItem],
  );

  const handleDeleteItem = useCallback(
    (itemId: string) => {
      deleteItem.mutate(itemId);
    },
    [deleteItem],
  );

  const handleClearChecked = useCallback(() => {
    clearChecked.mutate();
  }, [clearChecked]);

  const handleEditCategory = useCallback((cat: ShoppingCategoryDTO) => {
    setEditingCategory(cat);
    setManageCategoriesOpen(true);
  }, []);

  const handleManageCategoriesOpenChange = useCallback((open: boolean) => {
    setManageCategoriesOpen(open);
    if (!open) setEditingCategory(null);
  }, []);

  return {
    /* loading */
    isLoading: isLoadingLists || isLoadingItems,

    /* lists */
    lists: lists ?? [],
    activeListId,
    activeList,
    handleSelectList,
    handleEditList,
    handleCloneList,
    handleDeleteListRequest,
    handleDeleteListConfirmed,

    /* data */
    categories,
    activeCategories,
    itemsByCategory,
    totalItems,
    checkedItems,
    progressPct,

    /* dialog state */
    manageCategoriesOpen,
    handleManageCategoriesOpenChange,
    editingCategory,
    addItemOpen,
    setAddItemOpen,
    createListOpen,
    handleCreateListOpenChange,
    editingList,
    deletingList,
    setDeletingList,

    /* actions */
    handleToggleItem,
    handleDeleteItem,
    handleClearChecked,
    handleEditCategory,
    isClearingChecked: clearChecked.isPending,
  };
}
