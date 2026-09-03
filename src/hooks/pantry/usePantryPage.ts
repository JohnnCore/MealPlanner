'use client';

import type { IngredientCategory } from '@prisma/client';
import { useCallback, useMemo, useState } from 'react';

import { INGREDIENT_CATEGORIES } from '@/constants/ingredients';
import { FRESHNESS_LOW_THRESHOLD } from '@/constants/pantry';
import type { PantryItemDTO } from '@/types/pantry';

import { usePantryItems } from './usePantryItem';

export type PantryCategoryFilter = 'All' | IngredientCategory;

/**
 * Page-level orchestrator for the Pantry page. Composes the items query and owns
 * filter + dialog state. Each dialog (Add/Edit/Delete) owns its own mutation hook
 * directly, mirroring the shopping domain's AddItemDialog/DeleteListDialog.
 */
export function usePantryPage(initialItems?: PantryItemDTO[]) {
  const { data, isLoading } = usePantryItems(initialItems);
  const items = useMemo(() => data ?? [], [data]);

  /* -- Filters -- */
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PantryCategoryFilter>('All');

  // Always show the full set of category filters, not just categories the pantry
  // currently has items in — an empty pantry (or one missing a category) should still
  // offer every filter, rather than a filter bar that grows/shrinks with contents.
  const categories = useMemo<PantryCategoryFilter[]>(() => ['All', ...INGREDIENT_CATEGORIES], []);

  // Distinct categories actually represented in the pantry — used for the "Categories"
  // stat card, which is a real count of what's on hand, not the filter bar's full list.
  const distinctCategoryCount = useMemo(() => new Set(items.map(i => i.category)).size, [items]);

  const filteredItems = useMemo(
    () =>
      items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [items, searchQuery, selectedCategory],
  );

  const expiringCount = items.filter(
    i => i.freshnessPercent !== null && i.freshnessPercent < FRESHNESS_LOW_THRESHOLD,
  ).length;

  /* -- Dialog state -- */
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PantryItemDTO | null>(null);
  const [deletingItem, setDeletingItem] = useState<PantryItemDTO | null>(null);

  const handleEditItem = useCallback((item: PantryItemDTO) => {
    setEditingItem(item);
  }, []);

  const handleDeleteItemRequest = useCallback((item: PantryItemDTO) => {
    setDeletingItem(item);
  }, []);

  return {
    isLoading,
    items,
    filteredItems,
    categories,
    distinctCategoryCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    expiringCount,

    addItemOpen,
    setAddItemOpen,
    editingItem,
    setEditingItem,
    deletingItem,
    setDeletingItem,

    handleEditItem,
    handleDeleteItemRequest,
  };
}
