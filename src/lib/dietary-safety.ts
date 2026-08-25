import type { DietType, IngredientCategory } from '@prisma/client';

/**
 * Keyword heuristics for spotting a likely allergen in an AI-generated ingredient name.
 * This is a best-effort safety net layered on top of the generation prompt's explicit
 * allergy instruction (see services/ai.ts) — it is NOT exhaustive or authoritative food
 * safety data. A miss here doesn't mean an ingredient is safe; a hit triggers a
 * regeneration attempt rather than silently serving the recipe (see recipeGenerator.ts).
 */
export const ALLERGY_KEYWORDS: Record<string, string[]> = {
  Dairy: ['milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'whey', 'ghee', 'custard'],
  Eggs: ['egg'],
  Fish: ['fish', 'salmon', 'tuna', 'cod', 'anchov', 'sardine', 'trout', 'halibut', 'mackerel'],
  Shellfish: [
    'shrimp',
    'prawn',
    'crab',
    'lobster',
    'scallop',
    'clam',
    'mussel',
    'oyster',
    'squid',
    'calamari',
  ],
  'Tree Nuts': [
    'almond',
    'walnut',
    'cashew',
    'pistachio',
    'pecan',
    'hazelnut',
    'macadamia',
    'brazil nut',
  ],
  Peanuts: ['peanut'],
  Wheat: ['wheat', 'flour', 'bread', 'pasta', 'noodle', 'couscous', 'semolina', 'breadcrumb'],
  Soy: ['soy', 'tofu', 'edamame', 'miso', 'tempeh'],
};

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

const DIET_EXCLUDED_CATEGORIES: Partial<Record<DietType, IngredientCategory[]>> = {
  VEGETARIAN: ['MEAT', 'FISH'],
  VEGAN: ['MEAT', 'FISH', 'DAIRY'],
  PESCATARIAN: ['MEAT'],
};

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
