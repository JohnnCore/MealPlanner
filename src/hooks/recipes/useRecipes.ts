import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  cloneRecipeAction,
  cookRecipeAction,
  createRecipeAction,
  deleteRecipeAction,
  generateRecipeAction,
  updateRecipeAction,
} from '@/actions/recipes/actions';
import { queryKeys } from '@/constants/queryKeys';
import type { GenerateRecipeInput, SaveRecipeInput } from '@/lib/schemas/recipes';
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
 * Marks a recipe as cooked. This mutates pantry rows server-side and, when started from
 * the Meal Planner, marks the planned meal cooked — so on success it invalidates both caches. No `successMessage` —
 * `CookRecipeDialog` shows a detailed consumed/skipped breakdown inline once this
 * resolves, so a generic toast on top of it would just be noise.
 */
export function useCookRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      recipeId,
      substitutions,
      mealPlanId,
    }: {
      recipeId: string;
      /** Recipe ingredient id -> pantry ingredient id, for confirmed "possible match" picks. */
      substitutions?: Record<string, string>;
      /** The planned meal being cooked, when started from the Meal Planner. */
      mealPlanId?: string;
    }) => unwrapAction(cookRecipeAction(recipeId, substitutions, mealPlanId)),
    meta: { errorMessage: 'Failed to update pantry' },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.pantry.items() });
      void qc.invalidateQueries({ queryKey: queryKeys.mealPlan.all });
    },
  });
}

export function useCreateRecipe() {
  return useMutation({
    mutationFn: (values: SaveRecipeInput) => unwrapAction(createRecipeAction(values)),
    meta: { successMessage: 'Recipe created', errorMessage: 'Failed to create recipe' },
  });
}

export function useUpdateRecipe() {
  return useMutation({
    mutationFn: ({ recipeId, values }: { recipeId: string; values: SaveRecipeInput }) =>
      unwrapAction(updateRecipeAction(recipeId, values)),
    meta: { successMessage: 'Recipe updated', errorMessage: 'Failed to update recipe' },
  });
}

/** Also invalidates the meal plan cache — deleting a recipe removes its upcoming planned meals. */
export function useDeleteRecipe() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) => unwrapAction(deleteRecipeAction(recipeId)),
    meta: { successMessage: 'Recipe deleted', errorMessage: 'Failed to delete recipe' },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.mealPlan.all });
    },
  });
}

export function useCloneRecipe() {
  return useMutation({
    mutationFn: (recipeId: string) => unwrapAction(cloneRecipeAction(recipeId)),
    meta: { successMessage: 'Recipe cloned', errorMessage: 'Failed to clone recipe' },
  });
}
