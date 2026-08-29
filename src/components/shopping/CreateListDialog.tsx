'use client';

import type { ListColor } from '@prisma/client';
import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LIST_COLOR_THEMES, LIST_COLORS } from '@/constants/shopping';
import { useCreateList, useUpdateList } from '@/hooks/shopping/useShoppingList';
import { cn } from '@/lib/utils';
import type { ShoppingListSummaryDTO } from '@/types/shopping';

interface CreateListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the new list id after successful creation */
  onCreated?: (listId: string) => void;
  /** When provided, the dialog switches to edit mode with pre-filled values */
  editList?: ShoppingListSummaryDTO | null;
}

export function CreateListDialog({
  open,
  onOpenChange,
  onCreated,
  editList = null,
}: CreateListDialogProps) {
  const createList = useCreateList();
  const updateList = useUpdateList();

  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<ListColor>('PRIMARY');

  const resetForm = useCallback(() => {
    setName('');
    setColor('PRIMARY');
  }, []);

  /* -- Sync form when dialog opens / editList changes (render-time adjustment) -- */
  const [prevOpen, setPrevOpen] = useState<boolean>(open);
  const [prevEditList, setPrevEditList] = useState<ShoppingListSummaryDTO | null>(editList);

  if (open !== prevOpen || editList !== prevEditList) {
    setPrevOpen(open);
    setPrevEditList(editList);

    if (!open) {
      resetForm();
    } else if (open && editList && editList !== prevEditList) {
      setName(editList.name);
      setColor(editList.color);
    }
  }

  const isEditing = !!editList;
  const isPending = isEditing ? updateList.isPending : createList.isPending;

  const handleSubmit = async () => {
    if (!name.trim()) return;

    if (isEditing) {
      updateList.mutate(
        { id: editList.id, name: name.trim(), color },
        {
          onSuccess: () => {
            resetForm();
            onOpenChange(false);
          },
        },
      );
    } else {
      createList.mutate(
        { name: name.trim(), color },
        {
          onSuccess: data => {
            resetForm();
            onOpenChange(false);
            onCreated?.(data.id);
          },
        },
      );
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Shopping List' : 'Create New Shopping List'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* List name */}
          <div className="space-y-1.5">
            <Label htmlFor="list-name">List Name *</Label>
            <Input
              id="list-name"
              placeholder="e.g., Weekly Groceries"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {/* Color theme picker */}
          <div className="space-y-1.5">
            <Label>Color Theme</Label>
            <div className="flex flex-wrap gap-2">
              {LIST_COLORS.map(c => {
                const theme = LIST_COLOR_THEMES[c];
                return (
                  <button
                    key={c}
                    className={cn(
                      'rounded-lg px-4 py-2 text-sm font-medium text-white transition-all',
                      theme.solid,
                      color === c
                        ? 'ring-2 ring-offset-2 ring-green-500'
                        : 'opacity-80 hover:opacity-100',
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

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-2 bg-green-600 hover:bg-green-700"
              disabled={!name.trim() || isPending}
              onClick={handleSubmit}
            >
              {isEditing ? 'Update List' : 'Create List'}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
