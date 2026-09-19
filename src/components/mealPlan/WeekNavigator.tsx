'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getWeekDates } from '@/utils/mealPlan';

interface WeekNavigatorProps {
  weekStart: Date;
  onPrevious: () => void;
  onNext: () => void;
  onThisWeek: () => void;
}

function formatWeekRange(weekStart: Date): string {
  const [start, , , , , , end] = getWeekDates(weekStart);
  const sameMonth = start.getMonth() === end.getMonth();
  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = end.toLocaleDateString(
    'en-US',
    sameMonth ? { day: 'numeric' } : { month: 'short', day: 'numeric' },
  );
  return `${startLabel} – ${endLabel}, ${end.getFullYear()}`;
}

export function WeekNavigator({ weekStart, onPrevious, onNext, onThisWeek }: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-2">
      <Button aria-label="Previous week" size="icon" variant="ghost" onClick={onPrevious}>
        <ChevronLeft />
      </Button>

      <div className="min-w-44 text-center">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <Calendar aria-hidden="true" className="size-5" />
          {formatWeekRange(weekStart)}
        </div>
        <button
          className="text-xs text-muted-foreground hover:underline"
          type="button"
          onClick={onThisWeek}
        >
          Back to this week
        </button>
      </div>

      <Button aria-label="Next week" size="icon" variant="ghost" onClick={onNext}>
        <ChevronRight />
      </Button>
    </div>
  );
}
