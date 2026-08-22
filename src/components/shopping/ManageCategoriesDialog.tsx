'use client';

import type { CategoryColor } from '@prisma/client';
import { Pencil, Trash2 } from 'lucide-react';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useCreateCategory,
  useDeleteCategory,
  useShoppingCategories,
  useUpdateCategory,
} from '@/hooks/shopping/useShoppingListCategory';
import { useShoppingListItems } from '@/hooks/shopping/useShoppingListItem';
import { CATEGORY_COLORS, CATEGORY_ICONS, COLOR_THEMES } from '@/lib/shopping-constants';
import { cn } from '@/lib/utils';
import type { ShoppingCategoryDTO } from '@/types/shopping';

interface ManageCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a category for editing when the dialog opens */
  editCategory?: ShoppingCategoryDTO | null;
  /** Active shopping list id (for cache invalidation) */
  listId: string | undefined;
}

export function ManageCategoriesDialog({
  open,
  onOpenChange,
  editCategory = null,
  listId,
}: ManageCategoriesDialogProps) {
  const { data: categories = [] } = useShoppingCategories();
  const { data: listData } = useShoppingListItems(listId);
  const createCategory = useCreateCategory(listId);
  const updateCategory = useUpdateCategory(listId);
  const deleteCategory = useDeleteCategory(listId);

  /* -- Form state -- */
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>(CATEGORY_ICONS[0]);
  const [color, setColor] = useState<CategoryColor>('GREEN');

  /* -- Edit mode -- */
  const [editing, setEditing] = useState<ShoppingCategoryDTO | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setIcon(CATEGORY_ICONS[0]);
    setColor('GREEN');
    setEditing(null);
  }, []);

  const startEditing = useCallback((cat: ShoppingCategoryDTO) => {
    setEditing(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setColor(cat.color);
  }, []);

  // Adjust form state based on props (no useEffect needed)
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevEditCat, setPrevEditCat] = useState(editCategory);

  if (open !== prevOpen || editCategory !== prevEditCat) {
    setPrevOpen(open);
    setPrevEditCat(editCategory);

    if (!open) {
      resetForm();
    } else if (open && editCategory && editCategory !== prevEditCat) {
      startEditing(editCategory);
    }
  }

  /* -- Item count per category -- */
  const itemCountMap = new Map<string, number>();
  for (const item of listData?.items ?? []) {
    itemCountMap.set(item.categoryId, (itemCountMap.get(item.categoryId) ?? 0) + 1);
  }

  /* -- Handlers -- */
  const handleCreate = () => {
    if (!name.trim()) return;
    createCategory.mutate({ name: name.trim(), icon, color }, { onSuccess: resetForm });
  };

  const handleUpdate = () => {
    if (!editing || !name.trim()) return;
    updateCategory.mutate(
      { id: editing.id, name: name.trim(), icon, color },
      { onSuccess: resetForm },
    );
  };

  const handleSubmit = editing ? handleUpdate : handleCreate;
  const isPending = editing ? updateCategory.isPending : createCategory.isPending;

  const handleDelete = (cat: ShoppingCategoryDTO) => {
    // If we're editing the category being deleted, cancel edit
    if (editing?.id === cat.id) resetForm();
    deleteCategory.mutate(cat.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit Category' : 'Manage Categories'}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2">
          {/* -- Create / Edit form -- */}
          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-semibold">
              {editing ? 'Edit Category Details' : 'Create New Category'}
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category Name *</Label>
              <Input
                id="cat-name"
                placeholder="e.g., Frozen Foods"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
            </div>

            {/* Icon picker */}
            <div className="space-y-1.5">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICONS.map(emoji => (
                  <button
                    key={emoji}
                    className={cn(
                      'flex h-11 w-11 items-center justify-center rounded-lg border-2 text-xl transition-colors',
                      icon === emoji
                        ? 'border-green-500 bg-green-50'
                        : 'border-transparent bg-gray-50 hover:bg-gray-100',
                    )}
                    type="button"
                    onClick={() => setIcon(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color theme picker */}
            <div className="space-y-1.5">
              <Label>Color Theme</Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map(c => {
                  const theme = COLOR_THEMES[c];
                  return (
                    <button
                      key={c}
                      className={cn(
                        'rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors',
                        theme.pill,
                        theme.pillText,
                        color === c ? 'border-green-500' : 'border-transparent',
                      )}
                      type="button"
                      onClick={() => setColor(c)}
                    >
                      {theme.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            {editing ? (
              <div className="flex gap-2">
                <Button
                  className="flex-2 bg-green-600 hover:bg-green-700"
                  disabled={!name.trim() || isPending}
                  onClick={handleUpdate}
                >
                  Update Category
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel Edit
                </Button>
              </div>
            ) : (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!name.trim() || isPending}
                onClick={handleCreate}
              >
                Add Category
              </Button>
            )}
          </div>

          <Separator className="my-4" />

          {/* -- Existing categories -- */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Your Categories</p>

            {categories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No categories yet. Create one above!
              </p>
            ) : null}

            {categories.map(cat => {
              const theme = COLOR_THEMES[cat.color];
              const count = itemCountMap.get(cat.id) ?? 0;
              return (
                <div
                  key={cat.id}
                  className={cn('flex items-center justify-between rounded-xl px-4 py-3', theme.bg)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cat.icon}</span>
                    <div>
                      <p className="font-medium">{cat.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {count} {count === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      className="text-muted-foreground hover:text-foreground"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => startEditing(cat)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      className="text-muted-foreground hover:text-destructive"
                      disabled={deleteCategory.isPending}
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleDelete(cat)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
