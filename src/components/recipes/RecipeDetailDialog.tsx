'use client';

import { ChefHat, Clock, Users } from 'lucide-react';
import { useState } from 'react';

import { CookRecipeDialog } from '@/components/recipes/CookRecipeDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABELS } from '@/constants/recipe';
import { UNIT_DISPLAY } from '@/constants/unit';
import { cn } from '@/lib/utils';
import type { RecipeDTO } from '@/types/recipes';
import { cardGradientFor } from '@/utils/recipe';

interface RecipeDetailDialogProps {
  recipe: RecipeDTO | null;
  onOpenChange: (open: boolean) => void;
}

export function RecipeDetailDialog({ recipe, onOpenChange }: RecipeDetailDialogProps) {
  const [cookOpen, setCookOpen] = useState(false);

  return (
    <Dialog open={!!recipe} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] w-full max-w-3xl gap-0 overflow-y-auto rounded-2xl p-0 shadow-2xl sm:max-w-3xl"
        showCloseButton={false}
      >
        {recipe ? (
          <>
            {/* -- Header: full-bleed gradient banner in place of a photo (AI text generation has no real image) -- */}
            <div className="relative h-64">
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center rounded-t-2xl bg-linear-to-br',
                  cardGradientFor(recipe.id),
                )}
              >
                <ChefHat aria-hidden="true" className="size-16 text-white/90" />
              </div>
              <Badge
                className={cn(
                  'absolute top-4 right-4 px-3 py-1 text-sm font-semibold',
                  DIFFICULTY_BADGE_CLASS[recipe.difficulty],
                )}
              >
                {DIFFICULTY_LABELS[recipe.difficulty]}
              </Badge>
            </div>

            <div className="p-6">
              <DialogTitle className="mb-2 text-2xl font-semibold">{recipe.title}</DialogTitle>
              {recipe.description ? (
                <DialogDescription className="mb-4">{recipe.description}</DialogDescription>
              ) : null}

              <div className="mb-6 flex items-center gap-6 border-b border-border pb-6">
                <div className="flex items-center gap-2">
                  <Clock aria-hidden="true" className="size-5 text-muted-foreground" />
                  <span className="text-sm">{recipe.cookTimeMinutes} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users aria-hidden="true" className="size-5 text-muted-foreground" />
                  <span className="text-sm">{recipe.servings} servings</span>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map(ingredient => (
                    <li key={ingredient.name} className="flex items-center gap-2 text-sm">
                      <div className="size-2 shrink-0 rounded-full bg-green-600" />
                      {ingredient.quantity} {UNIT_DISPLAY[ingredient.unit] ?? ingredient.unit}{' '}
                      {ingredient.name}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Instructions</h3>
                <ol className="space-y-3">
                  {recipe.instructions.map((instruction, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-3">
                <DialogClose asChild>
                  <Button className="flex-1" type="button" variant="outline">
                    Close
                  </Button>
                </DialogClose>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  type="button"
                  onClick={() => setCookOpen(true)}
                >
                  <ChefHat aria-hidden="true" className="size-4" />
                  Cook
                </Button>
              </div>
            </div>

            <CookRecipeDialog open={cookOpen} recipe={recipe} onOpenChange={setCookOpen} />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
