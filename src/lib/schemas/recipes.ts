import { IngredientCategory, RecipeDifficulty, UnitType } from '@prisma/client';
import * as z from 'zod';

export const generateRecipeSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, 'Describe what you want to cook')
    .max(500, 'Keep it under 500 characters'),
  /** Falls back to the user's profile default when omitted — see services/recipeGenerator.ts. */
  servings: z.number().int().min(1).max(12).optional(),
});

export type GenerateRecipeInput = z.infer<typeof generateRecipeSchema>;

export const MAX_RECIPE_INGREDIENTS = 50;
export const MAX_RECIPE_STEPS = 50;
export const MAX_COOK_TIME_MINUTES = 1440;
const MAX_RECIPE_SERVINGS = 24;

/**
 * One ingredient line in a hand-written recipe: either an existing catalogue row
 * (`ingredientId`) or the details for a new private one (`name` + `category`), the same
 * either/or contract as `addPantryItemSchema`.
 */
export const recipeIngredientInputSchema = z
  .object({
    ingredientId: z.string().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    category: z.nativeEnum(IngredientCategory).optional(),
    icon: z.string().trim().min(1).optional(),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unit: z.nativeEnum(UnitType),
  })
  .refine(data => !!data.ingredientId || !!(data.name && data.category), {
    message: 'Pick an existing ingredient or provide a name and category for a new one',
    path: ['name'],
  })
  .refine(data => !(data.ingredientId && (data.name || data.category)), {
    message: 'Provide either an existing ingredient or new-ingredient details, not both',
    path: ['ingredientId'],
  });

/** Create/edit payload for a user-written recipe (also used to edit an AI-generated one). */
export const saveRecipeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give the recipe a title')
    .max(120, 'Keep the title under 120 characters'),
  description: z.string().trim().max(500, 'Keep the description under 500 characters').optional(),
  servings: z.number().int().min(1).max(MAX_RECIPE_SERVINGS),
  cookTimeMinutes: z
    .number()
    .int()
    .min(1, 'Cook time must be at least 1 minute')
    .max(MAX_COOK_TIME_MINUTES),
  difficulty: z.nativeEnum(RecipeDifficulty),
  ingredients: z
    .array(recipeIngredientInputSchema)
    .min(1, 'Add at least one ingredient')
    .max(MAX_RECIPE_INGREDIENTS),
  instructions: z
    .array(z.string().trim().min(1, 'Steps cannot be empty'))
    .min(1, 'Add at least one step')
    .max(MAX_RECIPE_STEPS),
});

export type SaveRecipeInput = z.infer<typeof saveRecipeSchema>;
export type RecipeIngredientInput = z.infer<typeof recipeIngredientInputSchema>;
