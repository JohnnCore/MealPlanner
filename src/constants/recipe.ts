import { RecipeDifficulty } from '@prisma/client';

import type { IngredientAvailabilityStatus } from '@/types/recipes';

export const DIFFICULTIES = Object.values(RecipeDifficulty);

export const DIFFICULTY_LABELS: Record<RecipeDifficulty, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

/** Badge color per difficulty — mirrors the semantic colors used elsewhere (green/amber/red). */
export const DIFFICULTY_BADGE_CLASS: Record<RecipeDifficulty, string> = {
  EASY: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  HARD: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

/**
 * Deterministic gradient per recipe, used in place of a photo — AI generation only
 * produces text, so there's no real image to show without a separate image API.
 */
export const CARD_GRADIENTS = [
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-sky-400 to-indigo-600',
  'from-rose-400 to-pink-600',
  'from-lime-400 to-green-600',
];

/** Badge copy/color for how a recipe ingredient matches against the pantry — see `utils/recipe.ts`. */
export const INGREDIENT_AVAILABILITY_LABELS: Record<IngredientAvailabilityStatus, string> = {
  AVAILABLE: 'Have enough',
  INSUFFICIENT: 'Not enough',
  POSSIBLE_MATCH: 'Possible match',
  MISSING: 'Missing',
};

export const INGREDIENT_AVAILABILITY_BADGE_CLASS: Record<IngredientAvailabilityStatus, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  INSUFFICIENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  POSSIBLE_MATCH: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  MISSING: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};
