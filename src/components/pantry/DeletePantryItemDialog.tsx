'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeletePantryItem } from '@/hooks/pantry/usePantryItem';
import type { PantryItemDTO } from '@/types/pantry';

interface DeletePantryItemDialogProps {
  item: PantryItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeletePantryItemDialog({ item, open, onOpenChange }: DeletePantryItemDialogProps) {
  const deleteItem = useDeletePantryItem();

  const handleDelete = () => {
    if (!item) return;
    deleteItem.mutate(item.id, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove from pantry?</AlertDialogTitle>
          <AlertDialogDescription>
            {item ? (
              <>
                This removes <span className="font-semibold">{item.name}</span> from your pantry.
                This cannot be undone.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={deleteItem.isPending}
            onClick={event => {
              event.preventDefault();
              handleDelete();
            }}
          >
            {deleteItem.isPending ? 'Removing…' : 'Remove'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
