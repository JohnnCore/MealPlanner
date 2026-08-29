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

export const DIET_EXCLUDED_CATEGORIES: Partial<Record<DietType, IngredientCategory[]>> = {
  VEGETARIAN: ['MEAT', 'FISH'],
  VEGAN: ['MEAT', 'FISH', 'DAIRY'],
  PESCATARIAN: ['MEAT'],
};
