'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UNIT_DISPLAY } from '@/constants/unit';
import type { ShoppingListItemDTO } from '@/types/shopping';

interface CompleteShoppingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ShoppingListItemDTO[];
  onConfirm: () => void;
  isPending: boolean;
}

export function CompleteShoppingDialog({
  open,
  onOpenChange,
  items,
  onConfirm,
  isPending,
}: CompleteShoppingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Pantry?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This adds the following {items.length} checked {items.length === 1 ? 'item' : 'items'}{' '}
            to your pantry and removes them from this list.
          </p>

          <ul className="max-h-60 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {items.map(item => (
              <li key={item.id} className="flex items-center justify-between px-1 py-1 text-sm">
                <span>{item.name}</span>
                <span className="text-muted-foreground">
                  {item.quantity} {UNIT_DISPLAY[item.unit]}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={items.length === 0 || isPending}
              onClick={onConfirm}
            >
              {isPending ? 'Adding…' : 'Add to Pantry'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
