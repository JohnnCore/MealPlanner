import type { IngredientCategory, RecipeDifficulty, UnitType } from '@prisma/client';

/** One ingredient line on a recipe — flattens the `RecipeIngredient` join to a display-ready row. */
export interface RecipeIngredientDTO {
  name: string;
  quantity: number;
  unit: UnitType;
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
