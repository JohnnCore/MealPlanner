'use client';

import { CircleCheck, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABELS } from '@/constants/recipe';
import { cn } from '@/lib/utils';
import type { MealPlanDTO } from '@/types/mealPlan';
import { writeMealDragPayload } from '@/utils/mealPlan';

interface PlannedMealCardProps {
  mealPlan: MealPlanDTO;
  onOpen: (mealPlan: MealPlanDTO) => void;
  onRemove: (id: string) => void;
}

/** A planned meal inside a slot. Draggable to another slot until it's cooked. */
export function PlannedMealCard({ mealPlan, onOpen, onRemove }: PlannedMealCardProps) {
  const cooked = mealPlan.cookedAt !== null;

  return (
    <div className="group relative">
      <button
        className={cn(
          'w-full rounded-md border p-2 text-left text-sm transition-shadow hover:shadow-sm',
          cooked
            ? 'border-green-600/40 bg-green-50 dark:bg-green-900/20'
            : 'cursor-grab border-border bg-card active:cursor-grabbing',
        )}
        draggable={!cooked}
        type="button"
        onClick={() => onOpen(mealPlan)}
        onDragStart={event =>
          writeMealDragPayload(event.dataTransfer, { kind: 'plan', mealPlanId: mealPlan.id })
        }
      >
        <p className="line-clamp-2 pr-5 leading-tight font-medium">{mealPlan.recipeTitle}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          {cooked ? (
            <Badge className="bg-green-600 text-white">
              <CircleCheck aria-hidden="true" />
              Cooked
            </Badge>
          ) : (
            <Badge className={cn(DIFFICULTY_BADGE_CLASS[mealPlan.difficulty])}>
              {DIFFICULTY_LABELS[mealPlan.difficulty]}
            </Badge>
          )}
          <span>{mealPlan.cookTimeMinutes} min</span>
          <span>· {mealPlan.servings} servings</span>
        </div>
      </button>

      <button
        aria-label={`Remove ${mealPlan.recipeTitle} from the planner`}
        className="absolute top-1.5 right-1.5 rounded-md p-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-destructive/10"
        type="button"
        onClick={() => onRemove(mealPlan.id)}
      >
        <Trash2 aria-hidden="true" className="size-3.5 text-destructive" />
      </button>
    </div>
  );
}
