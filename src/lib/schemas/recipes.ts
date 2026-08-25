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
