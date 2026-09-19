'use client';

import { ChefHat } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MEAL_TYPE_LABELS } from '@/constants/mealPlan';
import type { MealSlotTarget } from '@/types/mealPlan';
import type { RecipeDTO } from '@/types/recipes';

interface PickRecipeDialogProps {
  slot: MealSlotTarget | null;
  recipes: RecipeDTO[];
  onPick: (recipe: RecipeDTO, slot: MealSlotTarget) => void;
  onOpenChange: (open: boolean) => void;
}

/** Keyboard/touch-friendly alternative to dragging a recipe onto a slot. */
export function PickRecipeDialog({ slot, recipes, onPick, onOpenChange }: PickRecipeDialogProps) {
  return (
    <Dialog open={!!slot} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Plan {slot ? MEAL_TYPE_LABELS[slot.mealType].toLowerCase() : 'a meal'}
          </DialogTitle>
          <DialogDescription>Choose a recipe for this slot.</DialogDescription>
        </DialogHeader>

        {recipes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            You have no recipes yet — generate one from AI Recipes first.
          </p>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto">
            {recipes.map(recipe => (
              <li key={recipe.id}>
                <button
                  className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left text-sm transition-colors hover:bg-muted"
                  type="button"
                  onClick={() => slot && onPick(recipe, slot)}
                >
                  <ChefHat aria-hidden="true" className="size-4 shrink-0 text-green-600" />
                  <span className="flex-1 font-medium">{recipe.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {recipe.cookTimeMinutes} min
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
