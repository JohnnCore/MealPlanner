import { MealSlot } from '@/components/mealPlan/MealSlot';
import { MEAL_TYPES } from '@/constants/mealPlan';
import { cn } from '@/lib/utils';
import type { MealDragPayload, MealPlanDTO, MealSlotTarget } from '@/types/mealPlan';
import { slotKey, toDateKey } from '@/utils/mealPlan';

interface DayColumnProps {
  date: Date;
  isToday: boolean;
  mealPlansBySlot: Map<string, MealPlanDTO>;
  onDrop: (payload: MealDragPayload, slot: MealSlotTarget) => void;
  onAdd: (slot: MealSlotTarget) => void;
  onOpen: (mealPlan: MealPlanDTO) => void;
  onRemove: (id: string) => void;
}

export function DayColumn({
  date,
  isToday,
  mealPlansBySlot,
  onDrop,
  onAdd,
  onOpen,
  onRemove,
}: DayColumnProps) {
  const dateKey = toDateKey(date);

  return (
    <div
      className={cn(
        'flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card',
        isToday && 'border-green-600 ring-1 ring-green-600/30',
      )}
    >
      <div className="border-b border-border bg-muted/50 px-4 py-3 text-center">
        <h3 className={cn('font-semibold', isToday && 'text-green-700 dark:text-green-400')}>
          {date.toLocaleDateString('en-US', { weekday: 'long' })}
        </h3>
        <p className="text-xs text-muted-foreground">
          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
      </div>

      <div className="flex-1 space-y-3 p-3">
        {MEAL_TYPES.map(mealType => (
          <MealSlot
            key={mealType}
            mealPlan={mealPlansBySlot.get(slotKey(dateKey, mealType))}
            slot={{ date: dateKey, mealType }}
            onAdd={onAdd}
            onDrop={onDrop}
            onOpen={onOpen}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}
