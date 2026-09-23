import { useState } from 'react';

import {
  useCloneRecipe,
  useCreateRecipe,
  useDeleteRecipe,
  useGenerateRecipe,
  useUpdateRecipe,
} from '@/hooks/recipes/useRecipes';
import type { GenerateRecipeInput, SaveRecipeInput } from '@/lib/schemas/recipes';
import type { RecipeDTO } from '@/types/recipes';

type DifficultyFilter = 'All' | RecipeDTO['difficulty'];

export function useRecipesPage(initialRecipes: RecipeDTO[]) {
  const [recipes, setRecipes] = useState<RecipeDTO[]>(initialRecipes);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('All');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDTO | null>(null);

  /** `null` = closed, `'new'` = creating, a recipe = editing it. */
  const [formTarget, setFormTarget] = useState<RecipeDTO | 'new' | null>(null);

  const generateRecipe = useGenerateRecipe();
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const cloneRecipe = useCloneRecipe();
  /** The recipe awaiting delete confirmation — lifted here so cards and the detail dialog share one dialog. */
  const [recipeToDelete, setRecipeToDelete] = useState<RecipeDTO | null>(null);

  const handleGenerate = (values: GenerateRecipeInput) => {
    generateRecipe.mutate(values, {
      onSuccess: created => {
        setRecipes(prev => [created, ...prev]);
        setGenerateOpen(false);
      },
    });
  };

  const handleSave = (values: SaveRecipeInput) => {
    if (formTarget === 'new') {
      createRecipe.mutate(values, {
        onSuccess: created => {
          setRecipes(prev => [created, ...prev]);
          setFormTarget(null);
        },
      });
    } else if (formTarget) {
      updateRecipe.mutate(
        { recipeId: formTarget.id, values },
        {
          onSuccess: updated => {
            setRecipes(prev => prev.map(r => (r.id === updated.id ? updated : r)));
            // The detail dialog holds its own copy of the recipe — keep it in sync.
            setSelectedRecipe(prev => (prev?.id === updated.id ? updated : prev));
            setFormTarget(null);
          },
        },
      );
    }
  };

  const handleDelete = (recipe: RecipeDTO) => {
    deleteRecipe.mutate(recipe.id, {
      onSuccess: () => {
        setRecipes(prev => prev.filter(r => r.id !== recipe.id));
        setSelectedRecipe(null);
        setRecipeToDelete(null);
      },
    });
  };

  const handleClone = (recipe: RecipeDTO) => {
    cloneRecipe.mutate(recipe.id, {
      onSuccess: created => setRecipes(prev => [created, ...prev]),
    });
  };

  const filteredRecipes = recipes.filter(
    recipe => difficultyFilter === 'All' || recipe.difficulty === difficultyFilter,
  );

  return {
    recipes,
    filteredRecipes,
    difficultyFilter,
    setDifficultyFilter,
    generateOpen,
    setGenerateOpen,
    handleGenerate,
    isGenerating: generateRecipe.isPending,
    formTarget,
    setFormTarget,
    handleSave,
    isSaving: createRecipe.isPending || updateRecipe.isPending,
    handleDelete,
    handleClone,
    recipeToDelete,
    setRecipeToDelete,
    isDeleting: deleteRecipe.isPending,
    generateError: generateRecipe.error,
    selectedRecipe,
    setSelectedRecipe,
  };
}
