import { useMutation } from '@tanstack/react-query';

import { generateRecipeAction } from '@/actions/recipes/actions';
import { unwrapAction } from '@/lib/actionResult';
import type { GenerateRecipeInput } from '@/lib/schemas/recipes';

/**
 * Mutation-only — there's no useQuery here. The recipe list's initial data comes from
 * the page's Server Component, and a successful generation is prepended to that list
 * directly in useRecipesPage (no background refetch to justify an API route + query key yet).
 */
export function useGenerateRecipe() {
  return useMutation({
    mutationFn: (values: GenerateRecipeInput) => unwrapAction(generateRecipeAction(values)),
    meta: { successMessage: 'Recipe generated', errorMessage: 'Failed to generate recipe' },
  });
}
