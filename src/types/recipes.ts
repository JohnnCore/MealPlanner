import type { DietType, IngredientCategory, RecipeDifficulty, UnitType } from '@prisma/client';

/** One ingredient line on a recipe — flattens the `RecipeIngredient` join to a display-ready row. */
export interface RecipeIngredientDTO {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: UnitType;
}

export type IngredientAvailabilityStatus =
  'AVAILABLE' | 'INSUFFICIENT' | 'POSSIBLE_MATCH' | 'MISSING';

/** One pantry row that might be what a recipe ingredient is calling for — see `utils/recipe.ts`. */
export interface PossiblePantryMatch {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: UnitType;
}

/** A recipe ingredient matched against the user's pantry — see `utils/recipe.ts`. */
export interface RecipeIngredientAvailability {
  ingredientId: string;
  name: string;
  requiredQuantity: number;
  unit: UnitType;
  pantryQuantity: number;
  pantryUnit: UnitType | null;
  status: IngredientAvailabilityStatus;
  /** Set only when `status` is `POSSIBLE_MATCH` — every pantry row that might be it. */
  possibleMatches?: PossiblePantryMatch[];
}

/** Outcome of the "I've cooked this" confirmation — see `services/pantry.ts`'s `consumeRecipeIngredients`. */
export interface CookRecipeResultDTO {
  consumedCount: number;
  skippedCount: number;
}

export interface RecipeDTO {
  id: string;
  title: string;
  description: string | null;
  instructions: string[];
  servings: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  isAIGenerated: boolean;
  ingredients: RecipeIngredientDTO[];
  createdAt: string;
}

/** What the generate dialog needs from the profile to prefill/explain a request. */
export interface RecipeDietarySummaryDTO {
  defaultServings: number;
  dietType: DietType;
  allergyNames: string[];
}

/** Structured shape requested from Gemini via `responseSchema` — see `services/ai.ts`. */
export interface GeneratedRecipe {
  title: string;
  description: string;
  servings: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: UnitType;
    category: IngredientCategory;
  }>;
  instructions: string[];
}
