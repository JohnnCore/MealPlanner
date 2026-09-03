'use client';

import { AlertCircle, Plus, Search } from 'lucide-react';

import { AddPantryItemDialog } from '@/components/pantry/AddPantryItemDialog';
import { DeletePantryItemDialog } from '@/components/pantry/DeletePantryItemDialog';
import { EditPantryItemDialog } from '@/components/pantry/EditPantryItemDialog';
import { PantryItemCard } from '@/components/pantry/PantryItemCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { INGREDIENT_CATEGORY_LABELS } from '@/constants/ingredients';
import { usePantryPage } from '@/hooks/pantry/usePantryPage';
import { cn } from '@/lib/utils';
import type { PantryItemDTO } from '@/types/pantry';

export function PantryClient({ initialItems }: { initialItems: PantryItemDTO[] }) {
  const {
    isLoading,
    filteredItems,
    categories,
    distinctCategoryCount,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    expiringCount,
    items,
    addItemOpen,
    setAddItemOpen,
    editingItem,
    setEditingItem,
    deletingItem,
    setDeletingItem,
    handleEditItem,
    handleDeleteItemRequest,
  } = usePantryPage(initialItems);

  return (
    <main className="p-8">
      {/* -- Header -- */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl">My Pantry</h1>
        <p className="text-muted-foreground">Track your ingredients and reduce waste</p>
      </div>

      {/* -- Stats -- */}
      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm text-muted-foreground">Total Items</h3>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-xl">📦</span>
            </div>
          </div>
          <p className="text-3xl font-semibold text-foreground">{items.length}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm text-muted-foreground">Categories</h3>
            <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10">
              <span className="text-xl">🏷️</span>
            </div>
          </div>
          <p className="text-3xl font-semibold text-foreground">{distinctCategoryCount}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm text-muted-foreground">Expiring Soon</h3>
            <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="size-5 text-destructive" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-destructive">{expiringCount}</p>
        </div>
      </div>

      {/* -- Filters and search -- */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-auto rounded-lg border-border bg-card py-3 pl-10 focus-visible:ring-2 focus-visible:ring-green-500/30"
            placeholder="Search ingredients..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {categories.map(category => (
            <button
              key={category}
              className={cn(
                'rounded-lg px-4 py-3 whitespace-nowrap transition-all',
                selectedCategory === category
                  ? 'bg-green-600 text-white'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted',
              )}
              type="button"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'All' ? 'All' : INGREDIENT_CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>

        <button
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white shadow-sm transition-all hover:bg-green-700"
          type="button"
          onClick={() => setAddItemOpen(true)}
        >
          <Plus className="size-5" />
          Add Item
        </button>
      </div>

      {/* -- Items grid -- */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map(item => (
            <PantryItemCard
              key={item.id}
              item={item}
              onDelete={handleDeleteItemRequest}
              onEdit={handleEditItem}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredItems.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {items.length === 0
              ? 'Your pantry is empty. Add your first ingredient to get started!'
              : 'No ingredients found. Try a different search or category.'}
          </p>
        </div>
      ) : null}

      {/* -- Dialogs -- */}
      <AddPantryItemDialog open={addItemOpen} onOpenChange={setAddItemOpen} />
      <EditPantryItemDialog
        key={editingItem?.id ?? 'edit-pantry-item'}
        item={editingItem}
        open={!!editingItem}
        onOpenChange={open => {
          if (!open) setEditingItem(null);
        }}
      />
      <DeletePantryItemDialog
        item={deletingItem}
        open={!!deletingItem}
        onOpenChange={open => {
          if (!open) setDeletingItem(null);
        }}
      />
    </main>
  );
}
