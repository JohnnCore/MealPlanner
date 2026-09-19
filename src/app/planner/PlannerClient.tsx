'use client';

import Link from 'next/link';

import { DayColumn } from '@/components/mealPlan/DayColumn';
import { PickRecipeDialog } from '@/components/mealPlan/PickRecipeDialog';
import { RecipeDragCard } from '@/components/mealPlan/RecipeDragCard';
import { WeekNavigator } from '@/components/mealPlan/WeekNavigator';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useMealPlanPage } from '@/hooks/mealPlan/useMealPlanPage';
import type { MealPlanDTO } from '@/types/mealPlan';
import type { RecipeDTO } from '@/types/recipes';
import { toDateKey } from '@/utils/mealPlan';

interface PlannerClientProps {
  initialMealPlans: MealPlanDTO[];
  initialWeekStartKey: string;
  recipes: RecipeDTO[];
}

export function PlannerClient({
  initialMealPlans,
  initialWeekStartKey,
  recipes,
}: PlannerClientProps) {
  const {
    weekStart,
    weekDates,
    isLoading,
    mealPlansBySlot,
    plannedCount,
    cookedCount,
    daysPlanned,
    goToPreviousWeek,
    goToNextWeek,
    goToInitialWeek,
    handleDrop,
    removeMealPlan,
    pickerSlot,
    setPickerSlot,
    handlePickRecipe,
    detailRecipe,
    detailMealPlanId,
    detailIsCooked,
    closeDetail,
    handleOpenMealPlan,
    handleOpenRecipe,
  } = useMealPlanPage(initialWeekStartKey, initialMealPlans, recipes);

  const todayKey = toDateKey(new Date());

  return (
    <main className="p-8">
      {/* -- Header -- */}
      <div className="mb-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="mb-2 text-3xl">Meal Planner</h1>
            <p className="text-muted-foreground">
              Plan your week by dragging recipes into a slot — cook them from here when the time
              comes
            </p>
          </div>

          <WeekNavigator
            weekStart={weekStart}
            onNext={goToNextWeek}
            onPrevious={goToPreviousWeek}
            onThisWeek={goToInitialWeek}
          />
        </div>

        {/* -- Stats -- */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Meals Planned</p>
                <p className="text-2xl font-semibold">{plannedCount}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                🍽️
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Cooked</p>
                <p className="text-2xl font-semibold">
                  {cookedCount} / {plannedCount}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-secondary/10 text-xl">
                👨‍🍳
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-muted-foreground">Days Planned</p>
                <p className="text-2xl font-semibold">{daysPlanned} / 7</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent/30 text-xl">
                📅
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* -- Recipes to drag -- */}
        <aside className="w-full shrink-0 lg:w-72">
          <div className="rounded-xl border border-border bg-card p-4 lg:sticky lg:top-8">
            <h2 className="mb-3 font-semibold">Your recipes</h2>
            {recipes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recipes yet.{' '}
                <Link className="font-medium text-foreground underline" href="/recipes">
                  Generate one
                </Link>{' '}
                to start planning.
              </p>
            ) : (
              <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {recipes.map(recipe => (
                  <RecipeDragCard key={recipe.id} recipe={recipe} onOpen={handleOpenRecipe} />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* -- Week grid -- */}
        <div className="flex min-w-0 flex-1 gap-4 overflow-x-auto pb-2">
          {isLoading
            ? Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-60 shrink-0 rounded-xl" />
              ))
            : weekDates.map(date => (
                <DayColumn
                  key={toDateKey(date)}
                  date={date}
                  isToday={toDateKey(date) === todayKey}
                  mealPlansBySlot={mealPlansBySlot}
                  onAdd={setPickerSlot}
                  onDrop={handleDrop}
                  onOpen={handleOpenMealPlan}
                  onRemove={removeMealPlan}
                />
              ))}
        </div>
      </div>

      {/* -- Dialogs -- */}
      <PickRecipeDialog
        recipes={recipes}
        slot={pickerSlot}
        onOpenChange={open => {
          if (!open) setPickerSlot(null);
        }}
        onPick={handlePickRecipe}
      />
      <RecipeDetailDialog
        cooked={detailIsCooked}
        mealPlanId={detailMealPlanId}
        recipe={detailRecipe}
        onOpenChange={open => {
          if (!open) closeDetail();
        }}
      />
    </main>
  );
}
