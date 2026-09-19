'use client';

import { useCallback, useMemo, useState } from 'react';

import type { MealDragPayload, MealPlanDTO, MealSlotTarget } from '@/types/mealPlan';
import type { RecipeDTO } from '@/types/recipes';
import {
  addDays,
  getWeekDates,
  indexMealPlansBySlot,
  parseDateKey,
  toDateKey,
} from '@/utils/mealPlan';

import {
  useDeleteMealPlan,
  useMealPlansForRange,
  useMoveMealPlan,
  usePlanMeal,
} from './useMealPlan';

/** The recipe popup: opened from a planned meal (`mealPlanId` set, so cooking marks it) or from the sidebar. */
interface RecipeDetailTarget {
  recipeId: string;
  mealPlanId?: string;
}

/**
 * Page-level orchestrator for the Meal Planner. Owns the visible week, its meal plans
 * (the very first render is seeded by the Server Component, so there's no loading flash),
 * and the dialog state; turns drops into plan/move mutations.
 */
export function useMealPlanPage(
  initialWeekStartKey: string,
  initialMealPlans: MealPlanDTO[],
  recipes: RecipeDTO[],
) {
  const [weekStart, setWeekStart] = useState(() => parseDateKey(initialWeekStartKey));
  const startKey = toDateKey(weekStart);
  const endKey = toDateKey(addDays(weekStart, 6));

  const { data, isLoading } = useMealPlansForRange(
    startKey,
    endKey,
    startKey === initialWeekStartKey ? initialMealPlans : undefined,
  );
  const mealPlans = useMemo(() => data ?? [], [data]);
  const mealPlansBySlot = useMemo(() => indexMealPlansBySlot(mealPlans), [mealPlans]);
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const plannedCount = mealPlans.length;
  const cookedCount = mealPlans.filter(meal => meal.cookedAt !== null).length;
  const daysPlanned = new Set(mealPlans.map(meal => meal.date)).size;

  /* -- Week navigation -- */
  const goToPreviousWeek = () => setWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setWeekStart(prev => addDays(prev, 7));
  const goToInitialWeek = () => setWeekStart(parseDateKey(initialWeekStartKey));

  /* -- Mutations -- */
  const planMeal = usePlanMeal();
  const moveMealPlan = useMoveMealPlan();
  const deleteMealPlan = useDeleteMealPlan();

  const handleDrop = useCallback(
    (payload: MealDragPayload, slot: MealSlotTarget) => {
      if (payload.kind === 'recipe') planMeal.mutate({ recipeId: payload.recipeId, ...slot });
      else moveMealPlan.mutate({ id: payload.mealPlanId, ...slot });
    },
    [planMeal, moveMealPlan],
  );

  /* -- Dialogs -- */
  const [pickerSlot, setPickerSlot] = useState<MealSlotTarget | null>(null);
  const [detailTarget, setDetailTarget] = useState<RecipeDetailTarget | null>(null);

  const handlePickRecipe = (recipe: RecipeDTO, slot: MealSlotTarget) => {
    planMeal.mutate({ recipeId: recipe.id, ...slot });
    setPickerSlot(null);
  };

  const handleOpenMealPlan = (mealPlan: MealPlanDTO) =>
    setDetailTarget({ recipeId: mealPlan.recipeId, mealPlanId: mealPlan.id });

  const handleOpenRecipe = (recipe: RecipeDTO) => setDetailTarget({ recipeId: recipe.id });

  // Derived from live data so the popup's Cook button flips to "Cooked" as soon as the refetch lands.
  const detailRecipe = recipes.find(recipe => recipe.id === detailTarget?.recipeId) ?? null;
  const detailMealPlan = mealPlans.find(meal => meal.id === detailTarget?.mealPlanId);

  return {
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
    removeMealPlan: deleteMealPlan.mutate,

    pickerSlot,
    setPickerSlot,
    handlePickRecipe,

    detailRecipe,
    detailMealPlanId: detailMealPlan?.id,
    detailIsCooked: Boolean(detailMealPlan?.cookedAt),
    closeDetail: () => setDetailTarget(null),
    handleOpenMealPlan,
    handleOpenRecipe,
  };
}
