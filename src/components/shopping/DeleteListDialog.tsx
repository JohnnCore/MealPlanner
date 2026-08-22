'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDeleteList } from '@/hooks/shopping/useShoppingList';
import type { ShoppingListSummaryDTO } from '@/types/shopping';

interface DeleteListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: ShoppingListSummaryDTO | null;
  /** Called after successful deletion */
  onDeleted?: (listId: string) => void;
}

export function DeleteListDialog({ open, onOpenChange, list, onDeleted }: DeleteListDialogProps) {
  const deleteList = useDeleteList();

  const handleDelete = () => {
    if (!list) return;
    deleteList.mutate(list.id, {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.(list.id);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Shopping List</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">&quot;{list?.name}&quot;</span>? This
            will permanently remove the list and all its items. This action cannot be undone.
          </p>

          <div className="flex gap-2">
            <Button
              className="flex-2 bg-red-600 hover:bg-red-700"
              disabled={deleteList.isPending}
              onClick={handleDelete}
            >
              Delete List
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
