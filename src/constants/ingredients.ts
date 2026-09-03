import type { IngredientCategory } from '@prisma/client';

/** Display label per `IngredientCategory`, used in the category picker and filters. */
export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  VEGETABLE: 'Vegetables',
  FRUIT: 'Fruits',
  MEAT: 'Meat',
  FISH: 'Fish',
  DAIRY: 'Dairy',
  GRAIN: 'Grains',
  LEGUME: 'Legumes',
  SPICE: 'Spices',
  OIL: 'Oils',
  OTHER: 'Other',
};

/** Default emoji per `IngredientCategory` — used when a user creates a new ingredient
 * without picking their own icon. */
export const INGREDIENT_CATEGORY_ICONS: Record<IngredientCategory, string> = {
  VEGETABLE: '🥕',
  FRUIT: '🍎',
  MEAT: '🥩',
  FISH: '🐟',
  DAIRY: '🥛',
  GRAIN: '🌾',
  LEGUME: '🫘',
  SPICE: '🧂',
  OIL: '🫒',
  OTHER: '🥘',
};

export const INGREDIENT_CATEGORIES = Object.keys(
  INGREDIENT_CATEGORY_LABELS,
) as IngredientCategory[];
