import type { DietType } from '@prisma/client';

/**
 * Display labels for the `DietType` enum.
 * `OMNIVORE` is the schema default and reads as "No Preference" in the UI —
 * it's the absence of a restriction, not a diet the user opted into.
 */
export const DIET_TYPE_LABELS: Record<DietType, string> = {
  OMNIVORE: 'No Preference',
  VEGETARIAN: 'Vegetarian',
  VEGAN: 'Vegan',
  PESCATARIAN: 'Pescatarian',
  KETO: 'Keto',
  PALEO: 'Paleo',
  GLUTEN_FREE: 'Gluten-Free',
  LOW_CARB: 'Low Carb',
};

export const DIET_TYPES = Object.keys(DIET_TYPE_LABELS) as DietType[];
