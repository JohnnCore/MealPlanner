import { useState } from 'react';

import { useGenerateRecipe } from '@/hooks/recipes/useRecipes';
import type { GenerateRecipeInput } from '@/lib/schemas/recipes';
import type { RecipeDTO } from '@/types/recipes';

type DifficultyFilter = 'All' | RecipeDTO['difficulty'];

export function useRecipesPage(initialRecipes: RecipeDTO[]) {
  const [recipes, setRecipes] = useState<RecipeDTO[]>(initialRecipes);
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('All');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDTO | null>(null);

  const generateRecipe = useGenerateRecipe();

  const handleGenerate = (values: GenerateRecipeInput) => {
    generateRecipe.mutate(values, {
      onSuccess: created => {
        setRecipes(prev => [created, ...prev]);
        setGenerateOpen(false);
      },
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
    generateError: generateRecipe.error,
    selectedRecipe,
    setSelectedRecipe,
  };
}
