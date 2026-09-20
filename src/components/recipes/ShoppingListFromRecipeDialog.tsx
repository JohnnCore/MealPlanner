'use client';

import { CircleCheck, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  INGREDIENT_AVAILABILITY_BADGE_CLASS,
  INGREDIENT_AVAILABILITY_LABELS,
} from '@/constants/recipe';
import { UNIT_DISPLAY } from '@/constants/unit';
import { usePantryItems } from '@/hooks/pantry/usePantryItem';
import { useCreateListFromRecipe } from '@/hooks/shopping/useShoppingList';
import { useShoppingCategories } from '@/hooks/shopping/useShoppingListCategory';
import { cn } from '@/lib/utils';
import type { RecipeDTO, RecipeIngredientAvailability } from '@/types/recipes';
import type { ShoppingListSummaryDTO } from '@/types/shopping';
import { getIngredientAvailability, getShoppingLines } from '@/utils/recipe';

interface ShoppingListFromRecipeDialogProps {
  recipe: RecipeDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatAmount(quantity: number, unit: RecipeIngredientAvailability['unit']): string {
  return `${Math.round(quantity * 100) / 100} ${UNIT_DISPLAY[unit] ?? unit}`;
}

/** The pantry-comparison line under an ingredient's name. */
function detail(item: RecipeIngredientAvailability, toBuy: number | null): string {
  const needs = `Needs ${formatAmount(item.requiredQuantity, item.unit)}`;

  if (item.status === 'AVAILABLE') {
    return `${needs} · have ${formatAmount(item.pantryQuantity, item.pantryUnit ?? item.unit)}`;
  }
  if (item.status === 'INSUFFICIENT') {
    return `${needs} · have ${formatAmount(item.pantryQuantity, item.pantryUnit ?? item.unit)} · buy ${formatAmount(toBuy ?? 0, item.unit)}`;
  }
  return needs;
}

/**
 * Builds a brand-new shopping list from a recipe: every ingredient is checked against the
 * pantry (with unit conversion), and only what's missing or short is added. Ingredients
 * that only matched by name ("possible matches") are resolved here — "I have it" keeps
 * them off the list, "Missing" adds them alongside the rest.
 */
export function ShoppingListFromRecipeDialog({
  recipe,
  open,
  onOpenChange,
}: ShoppingListFromRecipeDialogProps) {
  const { data: pantryItems, isLoading: pantryLoading } = usePantryItems(undefined, {
    enabled: open,
  });
  const { data: categories = [], isLoading: categoriesLoading } = useShoppingCategories();
  const createList = useCreateListFromRecipe();

  // Recipe ingredient ids of possible-match rows the user confirmed as already owned.
  const [owned, setOwned] = useState<ReadonlySet<string>>(new Set());
  const [pickedCategoryId, setPickedCategoryId] = useState('');
  const [created, setCreated] = useState<ShoppingListSummaryDTO | null>(null);

  const categoryId = pickedCategoryId || categories[0]?.id || '';
  const availability = getIngredientAvailability(recipe.ingredients, pantryItems ?? []);
  const lines = getShoppingLines(availability, owned);
  const quantityToBuy = new Map(lines.map(line => [line.ingredientId, line.quantity]));
  const isLoading = pantryLoading || categoriesLoading;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setOwned(new Set());
      setPickedCategoryId('');
      setCreated(null);
    }
    onOpenChange(next);
  };

  const setHave = (ingredientId: string, have: boolean) => {
    setOwned(prev => {
      const next = new Set(prev);
      if (have) next.add(ingredientId);
      else next.delete(ingredientId);
      return next;
    });
  };

  const handleCreate = () => {
    createList.mutate(
      { recipeId: recipe.id, categoryId, ownedIngredientIds: [...owned] },
      { onSuccess: setCreated },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart aria-hidden="true" className="size-5 text-green-600" />
            Shopping list for {recipe.title}
          </DialogTitle>
          <DialogDescription>
            {created
              ? 'Your new list is ready.'
              : 'We compared the recipe with your pantry. Only what you are missing goes on the list.'}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <div className="flex items-start gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-300">
            <CircleCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              Created &quot;{created.name}&quot; with {created.itemCount} item
              {created.itemCount === 1 ? '' : 's'}.
            </span>
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {availability.map(item => {
                const isCandidate = item.status === 'POSSIBLE_MATCH';
                const have = owned.has(item.ingredientId);
                const willBuy = quantityToBuy.has(item.ingredientId);

                return (
                  <li
                    key={item.ingredientId}
                    className={cn(
                      'flex flex-col gap-2 rounded-lg border border-border p-3 text-sm',
                      !willBuy && 'opacity-70',
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.name}</p>
                      <Badge
                        className={cn('shrink-0', INGREDIENT_AVAILABILITY_BADGE_CLASS[item.status])}
                      >
                        {INGREDIENT_AVAILABILITY_LABELS[item.status]}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground">
                      {detail(item, quantityToBuy.get(item.ingredientId) ?? null)}
                    </p>

                    {isCandidate ? (
                      <div className="space-y-2">
                        <p className="text-muted-foreground">
                          Possibly your{' '}
                          {item.possibleMatches
                            ?.map(
                              match =>
                                `${match.name} (${formatAmount(match.quantity, match.unit)})`,
                            )
                            .join(', ')}
                          . Same ingredient?
                        </p>
                        <div className="flex gap-2">
                          <Button
                            aria-pressed={have}
                            size="sm"
                            type="button"
                            variant={have ? 'default' : 'outline'}
                            onClick={() => setHave(item.ingredientId, true)}
                          >
                            I have it
                          </Button>
                          <Button
                            aria-pressed={!have}
                            size="sm"
                            type="button"
                            variant={have ? 'outline' : 'default'}
                            onClick={() => setHave(item.ingredientId, false)}
                          >
                            Missing — add to list
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>

            {categories.length > 0 ? (
              <Select value={categoryId} onValueChange={setPickedCategoryId}>
                <SelectTrigger aria-label="Category for the new items" className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-xs text-muted-foreground">
                Create a category on the shopping list page first.
              </p>
            )}

            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                You already have everything for this recipe.
              </p>
            ) : null}
          </>
        )}

        <DialogFooter>
          {created ? (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Close
              </Button>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/shopping-list">Open shopping lists</Link>
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading || !categoryId || lines.length === 0 || createList.isPending}
                type="button"
                onClick={handleCreate}
              >
                {createList.isPending
                  ? 'Creating…'
                  : `Create list (${lines.length} item${lines.length === 1 ? '' : 's'})`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
