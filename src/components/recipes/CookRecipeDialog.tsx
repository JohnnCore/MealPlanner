'use client';

import { AlertTriangle, ChefHat, CircleCheck } from 'lucide-react';
import { useState } from 'react';

import { AddMissingIngredientButton } from '@/components/recipes/AddMissingIngredientButton';
import { PossibleMatchesButton } from '@/components/recipes/PossibleMatchesButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  INGREDIENT_AVAILABILITY_BADGE_CLASS,
  INGREDIENT_AVAILABILITY_LABELS,
} from '@/constants/recipe';
import { UNIT_DISPLAY } from '@/constants/unit';
import { usePantryItems } from '@/hooks/pantry/usePantryItem';
import { useCookRecipe } from '@/hooks/recipes/useRecipes';
import { cn } from '@/lib/utils';
import type { CookRecipeResultDTO, RecipeDTO, RecipeIngredientAvailability } from '@/types/recipes';
import {
  applyPossibleMatchSelection,
  getIngredientAvailability,
  suggestedShoppingQuantity,
} from '@/utils/recipe';

/** The pantry-comparison line under an ingredient's name — see `getIngredientAvailability`. */
function availabilityDetail(item: RecipeIngredientAvailability): string {
  const needs = `Needs ${item.requiredQuantity} ${UNIT_DISPLAY[item.unit] ?? item.unit}`;

  if (item.status === 'POSSIBLE_MATCH') {
    const count = item.possibleMatches?.length ?? 0;
    return `${needs} · ${count} possible match${count === 1 ? '' : 'es'} in your pantry`;
  }
  if (item.status === 'MISSING') {
    return needs;
  }
  return `${needs} · have ${item.pantryQuantity} ${
    UNIT_DISPLAY[item.pantryUnit ?? item.unit] ?? item.pantryUnit
  }`;
}

/** Plain-language summary of what `consumeRecipeIngredients` actually did. */
function resultSummary({ consumedCount, skippedCount }: CookRecipeResultDTO): string {
  const total = consumedCount + skippedCount;
  if (total === 0) return "This recipe has no ingredients, so your pantry wasn't changed.";

  if (skippedCount === 0) {
    return `Removed ${consumedCount} ingredient${consumedCount === 1 ? '' : 's'} from your pantry.`;
  }

  const consumedPart =
    consumedCount > 0
      ? `Removed ${consumedCount} of ${total} ingredients from your pantry.`
      : "Didn't find any of this recipe's ingredients in your pantry, so nothing was removed.";

  return `${consumedPart} ${skippedCount} ${skippedCount === 1 ? 'was' : 'were'} left untouched — not in your pantry, or logged in a different unit.`;
}

interface CookRecipeDialogProps {
  recipe: RecipeDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CookRecipeDialog({ recipe, open, onOpenChange }: CookRecipeDialogProps) {
  // Only fetches while the dialog is actually open — no reason to hit /api/pantry/items
  // just because a recipe's detail dialog is showing.
  const { data: pantryItems, isLoading } = usePantryItems(undefined, { enabled: open });
  const cookRecipe = useCookRecipe();
  const [result, setResult] = useState<CookRecipeResultDTO | null>(null);
  // Recipe ingredient id -> the pantry ingredient id the user confirmed as a match, for
  // rows that only came back as a POSSIBLE_MATCH by name.
  const [selectedMatches, setSelectedMatches] = useState<Record<string, string>>({});

  const rawAvailability = getIngredientAvailability(recipe.ingredients, pantryItems ?? []);
  const availability = rawAvailability.map(item => {
    const selectedIngredientId = selectedMatches[item.ingredientId];
    const candidate = item.possibleMatches?.find(
      match => match.ingredientId === selectedIngredientId,
    );
    return candidate ? applyPossibleMatchSelection(item, candidate) : item;
  });
  const missingCount = availability.filter(item => item.status !== 'AVAILABLE').length;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setResult(null);
      setSelectedMatches({});
    }
    onOpenChange(next);
  };

  const handleSelectMatch = (ingredientId: string, matchIngredientId: string | null) => {
    setSelectedMatches(prev => {
      if (!matchIngredientId) {
        const { [ingredientId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ingredientId]: matchIngredientId };
    });
  };

  const handleConfirm = () => {
    cookRecipe.mutate(
      { recipeId: recipe.id, substitutions: selectedMatches },
      { onSuccess: setResult },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat aria-hidden="true" className="size-5 text-green-600" />
            Cook {recipe.title}
          </DialogTitle>
          <DialogDescription>
            {result
              ? 'Here is what changed in your pantry.'
              : "See what's in your pantry, then confirm to remove the ingredients you used."}
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{resultSummary(result)}</span>
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {availability.map(item => (
                  <li
                    key={item.ingredientId}
                    className="flex flex-col gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.name}</p>
                      <Badge
                        className={cn('shrink-0', INGREDIENT_AVAILABILITY_BADGE_CLASS[item.status])}
                      >
                        {INGREDIENT_AVAILABILITY_LABELS[item.status]}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground">{availabilityDetail(item)}</p>

                    {item.status !== 'AVAILABLE' || item.possibleMatches ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        {item.possibleMatches ? (
                          <PossibleMatchesButton
                            ingredientName={item.name}
                            matches={item.possibleMatches}
                            selectedIngredientId={selectedMatches[item.ingredientId] ?? null}
                            onSelect={matchIngredientId =>
                              handleSelectMatch(item.ingredientId, matchIngredientId)
                            }
                          />
                        ) : null}
                        {item.status !== 'AVAILABLE' ? (
                          <AddMissingIngredientButton
                            ingredientId={item.ingredientId}
                            name={item.name}
                            suggestedQuantity={suggestedShoppingQuantity(item)}
                            unit={item.unit}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {missingCount > 0 ? (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span>
                  {missingCount} ingredient{missingCount > 1 ? 's are' : ' is'} missing or low — you
                  can still mark this recipe as cooked.
                </span>
              </div>
            ) : null}
          </>
        )}

        <DialogFooter>
          {result ? (
            <Button
              className="bg-green-600 hover:bg-green-700"
              type="button"
              onClick={() => handleOpenChange(false)}
            >
              Done
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={cookRecipe.isPending || isLoading}
                type="button"
                onClick={handleConfirm}
              >
                {cookRecipe.isPending ? 'Updating pantry…' : "I've cooked this"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
