import type { DietType, IngredientCategory } from '@prisma/client';

import { ALLERGY_KEYWORDS, DIET_EXCLUDED_CATEGORIES } from '@/constants/dietarySafety';

/** Returns the ingredient names that match one of the user's allergies, tagged with which. */
export function findAllergenMatches(ingredientNames: string[], allergyNames: string[]): string[] {
  const flagged = new Set<string>();

  for (const allergyName of allergyNames) {
    const keywords = ALLERGY_KEYWORDS[allergyName];
    if (!keywords) continue;

    for (const name of ingredientNames) {
      const lower = name.toLowerCase();
      if (keywords.some(kw => lower.includes(kw))) flagged.add(`${name} (${allergyName})`);
    }
  }

  return [...flagged];
}

/**
 * Returns ingredient names that structurally violate the diet. Only checks diets with a
 * clean ingredient-category or keyword mapping (vegetarian/vegan/pescatarian/gluten-free) —
 * keto/paleo/low-carb are quantity- and preparation-based, not something a single
 * ingredient's category can confirm or deny, so those rely on the prompt instruction alone.
 */
export function findDietViolations(
  ingredients: Array<{ name: string; category: IngredientCategory }>,
  dietType: DietType,
): string[] {
  if (dietType === 'GLUTEN_FREE') {
    return findAllergenMatches(
      ingredients.map(i => i.name),
      ['Wheat'],
    );
  }

  const excludedCategories = DIET_EXCLUDED_CATEGORIES[dietType];
  if (!excludedCategories) return [];

  return ingredients.filter(i => excludedCategories.includes(i.category)).map(i => i.name);
}
