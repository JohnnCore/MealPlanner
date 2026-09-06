'use client';

import { Check, HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UNIT_DISPLAY } from '@/constants/unit';
import { cn } from '@/lib/utils';
import type { PossiblePantryMatch } from '@/types/recipes';

interface PossibleMatchesButtonProps {
  ingredientName: string;
  matches: PossiblePantryMatch[];
  selectedIngredientId: string | null;
  onSelect: (ingredientId: string | null) => void;
}

/**
 * Lets the user confirm which pantry row (if any) a "possible match" recipe ingredient
 * actually is. The pick isn't just cosmetic — `CookRecipeDialog` re-evaluates that row's
 * availability against the chosen candidate, and passes it to the "cook" action as a
 * substitution so the right pantry row gets decremented instead of being left untouched.
 */
export function PossibleMatchesButton({
  ingredientName,
  matches,
  selectedIngredientId,
  onSelect,
}: PossibleMatchesButtonProps) {
  const selected = matches.find(match => match.ingredientId === selectedIngredientId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <HelpCircle aria-hidden="true" className="size-4" />
          {selected
            ? `Using "${selected.name}"`
            : matches.length === 1
              ? 'View possible match'
              : `View ${matches.length} possible matches`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-2">
        <p className="text-sm font-medium">Is one of these your &quot;{ingredientName}&quot;?</p>
        <ul className="space-y-1">
          {matches.map(match => {
            const isSelected = match.ingredientId === selectedIngredientId;
            return (
              <li key={match.ingredientId}>
                <button
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-left text-sm transition-colors',
                    isSelected
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/20'
                      : 'border-transparent hover:bg-muted',
                  )}
                  type="button"
                  onClick={() => onSelect(isSelected ? null : match.ingredientId)}
                >
                  <span className="flex items-center gap-2">
                    {isSelected ? (
                      <Check aria-hidden="true" className="size-4 shrink-0 text-green-600" />
                    ) : (
                      <span aria-hidden="true" className="size-4 shrink-0" />
                    )}
                    {match.name}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {match.quantity} {UNIT_DISPLAY[match.unit] ?? match.unit}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Matched by name only — pick one only if it&apos;s really the same ingredient. This decides
          what gets subtracted from your pantry when you confirm cooking.
        </p>
      </PopoverContent>
    </Popover>
  );
}
