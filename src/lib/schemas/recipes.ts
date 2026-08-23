import * as z from 'zod';

export const generateRecipeSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, 'Describe what you want to cook')
    .max(500, 'Keep it under 500 characters'),
});

export type GenerateRecipeInput = z.infer<typeof generateRecipeSchema>;
