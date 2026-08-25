import { RecipeDifficulty } from '@prisma/client';

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
const CARD_GRADIENTS = [
  'from-emerald-400 to-teal-600',
  'from-amber-400 to-orange-600',
  'from-sky-400 to-indigo-600',
  'from-rose-400 to-pink-600',
  'from-lime-400 to-green-600',
];

export function cardGradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}
