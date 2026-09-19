import type { MealType, RecipeDifficulty } from '@prisma/client';

/** A recipe planned into one of a day's meal slots. Planning never touches the pantry. */
export interface MealPlanDTO {
  id: string;
  recipeId: string;
  recipeTitle: string;
  difficulty: RecipeDifficulty;
  cookTimeMinutes: number;
  /** Calendar day as `YYYY-MM-DD` — a plain date, never a moment in time. */
  date: string;
  mealType: MealType;
  servings: number;
  /** Set once the meal was cooked (pantry ingredients consumed); cooked meals are locked in place. */
  cookedAt: string | null;
}

/** What a drag carries: a recipe from the sidebar (new plan) or an existing plan (move). */
export type MealDragPayload =
  { kind: 'recipe'; recipeId: string } | { kind: 'plan'; mealPlanId: string };

export interface MealSlotTarget {
  /** `YYYY-MM-DD` */
  date: string;
  mealType: MealType;
}
