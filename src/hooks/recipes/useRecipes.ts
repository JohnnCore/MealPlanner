import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cookRecipeAction, generateRecipeAction } from '@/actions/recipes/actions';
import { queryKeys } from '@/constants/queryKeys';
import type { GenerateRecipeInput } from '@/lib/schemas/recipes';
import { unwrapAction } from '@/utils/action';

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

/**
 * Marks a recipe as cooked. This mutates pantry rows server-side, not the recipe itself,
 * so on success it invalidates the pantry items query rather than any recipes cache.
 * No `successMessage` — `CookRecipeDialog` shows a detailed consumed/skipped breakdown
 * inline once this resolves, so a generic toast on top of it would just be noise.
 */
export function useCookRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      substitutions,
    }: {
      recipeId: string;
      /** Recipe ingredient id -> pantry ingredient id, for confirmed "possible match" picks. */
      substitutions?: Record<string, string>;
    }) => unwrapAction(cookRecipeAction(recipeId, substitutions)),
    meta: { errorMessage: 'Failed to update pantry' },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pantry.items() });
    },
  });
}
