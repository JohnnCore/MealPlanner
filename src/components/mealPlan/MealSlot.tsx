'use client';

import { Plus } from 'lucide-react';

import { PlannedMealCard } from '@/components/mealPlan/PlannedMealCard';
import { MEAL_TYPE_LABELS } from '@/constants/mealPlan';
import { useSlotDrop } from '@/hooks/mealPlan/useSlotDrop';
import { cn } from '@/lib/utils';
import type { MealDragPayload, MealPlanDTO, MealSlotTarget } from '@/types/mealPlan';

interface MealSlotProps {
  slot: MealSlotTarget;
  mealPlan: MealPlanDTO | undefined;
  onDrop: (payload: MealDragPayload, slot: MealSlotTarget) => void;
  onAdd: (slot: MealSlotTarget) => void;
  onOpen: (mealPlan: MealPlanDTO) => void;
  onRemove: (id: string) => void;
}

/** One of a day's three meal slots: a drop target that holds at most one planned meal. */
export function MealSlot({ slot, mealPlan, onDrop, onAdd, onOpen, onRemove }: MealSlotProps) {
  // A cooked meal is locked in place, so it doesn't accept drops.
  const { ref, isOver } = useSlotDrop(payload => onDrop(payload, slot), !!mealPlan?.cookedAt);
  const label = MEAL_TYPE_LABELS[slot.mealType];

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border-2 border-dashed p-2 transition-colors',
        isOver ? 'border-green-500 bg-green-500/10' : 'border-border',
      )}
    >
      <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase">{label}</p>

      {mealPlan ? (
        <PlannedMealCard mealPlan={mealPlan} onOpen={onOpen} onRemove={onRemove} />
      ) : (
        <button
          aria-label={`Add ${label.toLowerCase()} on ${slot.date}`}
          className="flex h-16 w-full items-center justify-center gap-1 rounded-md text-xs text-muted-foreground transition-colors hover:bg-muted"
          type="button"
          onClick={() => onAdd(slot)}
        >
          <Plus aria-hidden="true" className="size-3.5" />
          Drop or add a meal
        </button>
      )}
    </div>
  );
}
