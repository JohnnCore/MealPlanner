'use client';

import { Download, Grid2X2, PackageCheck, Plus, Share2, Trash2 } from 'lucide-react';

import { AddItemDialog } from '@/components/shopping/AddItemDialog';
import { CategoryCard } from '@/components/shopping/CategoryCard';
import { CompleteShoppingDialog } from '@/components/shopping/CompleteShoppingDialog';
import { CreateListDialog } from '@/components/shopping/CreateListDialog';
import { DeleteListDialog } from '@/components/shopping/DeleteListDialog';
import { ManageCategoriesDialog } from '@/components/shopping/ManageCategoriesDialog';
import { ShoppingListSelector } from '@/components/shopping/ShoppingListSelector';
import { ShoppingListSkeleton } from '@/components/shopping/ShoppingListSkeleton';
import { Button } from '@/components/ui/button';
import { useShoppingListPage } from '@/hooks/shopping/useShoppingListPage';
import { cn } from '@/lib/utils';
import type { ShoppingListSummaryDTO } from '@/types/shopping';

export function ShoppingListClient({ initialLists }: { initialLists: ShoppingListSummaryDTO[] }) {
  const {
    isLoading,
    lists,
    activeListId,
    activeList,
    handleSelectList,
    handleEditList,
    handleCloneList,
    handleDeleteListRequest,
    handleDeleteListConfirmed,
    activeCategories,
    itemsByCategory,
    totalItems,
    checkedItems,
    progressPct,
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
    checkedItemsList,
    completeShoppingOpen,
    setCompleteShoppingOpen,
    handleToggleItem,
    handleDeleteItem,
    handleClearChecked,
    handleCompleteShoppingConfirmed,
    handleEditCategory,
    isClearingChecked,
    isCompletingShopping,
  } = useShoppingListPage(initialLists);

  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* -- Header -- */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shopping Lists</h1>
          <p className="text-sm text-muted-foreground">
            Organize multiple shopping lists with shared categories
          </p>
        </div>
        <Button variant="outline" onClick={() => handleManageCategoriesOpenChange(true)}>
          <Grid2X2 className="size-4" />
          Categories
        </Button>
      </div>

      {/* -- List selector -- */}
      <div className="mt-4">
        <ShoppingListSelector
          activeList={activeList}
          lists={lists}
          onCloneList={handleCloneList}
          onCreateList={() => handleCreateListOpenChange(true)}
          onDeleteList={handleDeleteListRequest}
          onEditList={handleEditList}
          onSelectList={handleSelectList}
        />
      </div>

      {isLoading ? (
        <ShoppingListSkeleton />
      ) : (
        <>
          {/* -- Progress card -- */}
          {totalItems > 0 ? (
            <div className="mt-6 rounded-xl border bg-green-50/50 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Shopping Progress</p>
                  <p className="text-sm text-muted-foreground">
                    {checkedItems} of {totalItems} items completed
                  </p>
                </div>
                <span className="text-2xl font-bold text-green-600">{progressPct}%</span>
              </div>
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    progressPct < 50
                      ? 'bg-green-500'
                      : progressPct < 100
                        ? 'bg-orange-400'
                        : 'bg-green-500',
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : null}

          {/* -- Actions bar -- */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setAddItemOpen(true)}
              >
                <Plus className="size-4" />
                Add Item
              </Button>
              <Button variant="outline">
                <Share2 className="size-4" />
                Share List
              </Button>
              <Button variant="outline">
                <Download className="size-4" />
                Export
              </Button>
            </div>
            {checkedItems > 0 ? (
              <div className="flex gap-2">
                <Button
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-700"
                  variant="outline"
                  onClick={() => setCompleteShoppingOpen(true)}
                >
                  <PackageCheck className="size-4" />
                  Add to Pantry
                </Button>
                <Button
                  className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                  disabled={isClearingChecked}
                  variant="outline"
                  onClick={handleClearChecked}
                >
                  <Trash2 className="size-4" />
                  Clear {checkedItems} Checked
                </Button>
              </div>
            ) : null}
          </div>

          {/* -- Category grid -- */}
          {activeCategories.length === 0 ? (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Your shopping list is empty
              </p>
              <p className="text-sm text-muted-foreground">
                Create categories and add items to get started!
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {activeCategories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                items={itemsByCategory.get(cat.id) ?? []}
                onDeleteItem={handleDeleteItem}
                onEditCategory={handleEditCategory}
                onToggleItem={handleToggleItem}
              />
            ))}
          </div>
        </>
      )}

      {/* Dialogs */}
      <ManageCategoriesDialog
        editCategory={editingCategory}
        listId={activeListId}
        open={manageCategoriesOpen}
        onOpenChange={handleManageCategoriesOpenChange}
      />
      <AddItemDialog listId={activeListId} open={addItemOpen} onOpenChange={setAddItemOpen} />
      <CreateListDialog
        editList={editingList}
        open={createListOpen}
        onCreated={handleSelectList}
        onOpenChange={handleCreateListOpenChange}
      />
      <DeleteListDialog
        list={deletingList}
        open={!!deletingList}
        onDeleted={handleDeleteListConfirmed}
        onOpenChange={open => {
          if (!open) setDeletingList(null);
        }}
      />
      <CompleteShoppingDialog
        isPending={isCompletingShopping}
        items={checkedItemsList}
        open={completeShoppingOpen}
        onConfirm={handleCompleteShoppingConfirmed}
        onOpenChange={setCompleteShoppingOpen}
      />
    </main>
  );
}
