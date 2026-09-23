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
import type { RecipeDTO } from '@/types/recipes';

interface DeleteRecipeDialogProps {
  recipe: RecipeDTO | null;
  open: boolean;
  isDeleting: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (recipe: RecipeDTO) => void;
}

export function DeleteRecipeDialog({
  recipe,
  open,
  isDeleting,
  onOpenChange,
  onConfirm,
}: DeleteRecipeDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete recipe?</AlertDialogTitle>
          <AlertDialogDescription>
            {recipe ? (
              <>
                This deletes <span className="font-semibold">{recipe.title}</span> and removes it
                from any upcoming meals in your planner. Meals you already cooked are kept. This
                cannot be undone.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-white hover:bg-destructive/90"
            disabled={isDeleting}
            onClick={event => {
              event.preventDefault();
              if (recipe) onConfirm(recipe);
            }}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
