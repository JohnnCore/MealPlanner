import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  deleteMealPlanAction,
  moveMealPlanAction,
  planMealAction,
} from '@/actions/mealPlan/actions';
import { queryKeys } from '@/constants/queryKeys';
import { fetchMealPlans } from '@/lib/api/mealPlan';
import type { MealPlanDTO, MealSlotTarget } from '@/types/mealPlan';
import { unwrapAction } from '@/utils/action';

/* ---------------------- query ---------------------- */

/** `startKey`/`endKey` are `YYYY-MM-DD`; `initialData` seeds only the week the page opened on. */
export function useMealPlansForRange(
  startKey: string,
  endKey: string,
  initialData?: MealPlanDTO[],
) {
  return useQuery({
    queryKey: queryKeys.mealPlan.range(startKey, endKey),
    queryFn: () => fetchMealPlans(startKey, endKey),
    initialData,
  });
}

/* ---------------------- mutations ---------------------- */

function useInvalidateMealPlans() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.mealPlan.all });
}

// No success toasts below: the meal appearing (or leaving) its slot is the feedback.

export function usePlanMeal() {
  const invalidate = useInvalidateMealPlans();

  return useMutation({
    mutationFn: (payload: MealSlotTarget & { recipeId: string }) =>
      unwrapAction(planMealAction(payload)),
    meta: { errorMessage: 'Failed to plan meal' },
    onSettled: invalidate,
  });
}

export function useMoveMealPlan() {
  const invalidate = useInvalidateMealPlans();

  return useMutation({
    mutationFn: ({ id, ...slot }: MealSlotTarget & { id: string }) =>
      unwrapAction(moveMealPlanAction(id, slot)),
    meta: { errorMessage: 'Failed to move meal' },
    onSettled: invalidate,
  });
}

export function useDeleteMealPlan() {
  const invalidate = useInvalidateMealPlans();

  return useMutation({
    mutationFn: (id: string) => unwrapAction(deleteMealPlanAction(id)),
    meta: { errorMessage: 'Failed to remove meal' },
    onSettled: invalidate,
  });
}
