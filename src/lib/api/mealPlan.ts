import type { MealPlanDTO } from '@/types/mealPlan';

/** Reads only — writes are Server Actions (see src/actions/mealPlan/actions.ts). Keys are `YYYY-MM-DD`. */
export async function fetchMealPlans(start: string, end: string): Promise<MealPlanDTO[]> {
  const res = await fetch(`/api/meal-plan?${new URLSearchParams({ start, end }).toString()}`);
  if (!res.ok) throw new Error('Failed to fetch meal plan');
  return res.json();
}
