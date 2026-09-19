'use client';

import { ChefHat, Clock, GripVertical } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { RecipeDTO } from '@/types/recipes';
import { writeMealDragPayload } from '@/utils/mealPlan';
import { cardGradientFor } from '@/utils/recipe';

interface RecipeDragCardProps {
  recipe: RecipeDTO;
  onOpen: (recipe: RecipeDTO) => void;
}

/** A recipe in the planner sidebar — drag it onto a slot to plan it, or click to view it. */
export function RecipeDragCard({ recipe, onOpen }: RecipeDragCardProps) {
  return (
    <button
      draggable
      className="flex w-full cursor-grab items-center gap-3 rounded-lg border border-border bg-card p-2 text-left transition-shadow hover:shadow-md active:cursor-grabbing"
      type="button"
      onClick={() => onOpen(recipe)}
      onDragStart={event =>
        writeMealDragPayload(event.dataTransfer, { kind: 'recipe', recipeId: recipe.id })
      }
    >
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md bg-linear-to-br',
          cardGradientFor(recipe.id),
        )}
      >
        <ChefHat aria-hidden="true" className="size-5 text-white/90" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium">{recipe.title}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock aria-hidden="true" className="size-3" />
          {recipe.cookTimeMinutes} min
        </p>
      </div>
      <GripVertical aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
