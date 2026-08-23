'use client';

import { ChefHat, Sparkles } from 'lucide-react';

import { GenerateRecipeDialog } from '@/components/recipes/GenerateRecipeDialog';
import { RecipeCard } from '@/components/recipes/RecipeCard';
import { RecipeDetailDialog } from '@/components/recipes/RecipeDetailDialog';
import { Button } from '@/components/ui/button';
import { useRecipesPage } from '@/hooks/recipes/useRecipesPage';
import { DIFFICULTIES, DIFFICULTY_LABELS } from '@/lib/recipe-constants';
import { cn } from '@/lib/utils';
import type { RecipeDTO } from '@/types/recipes';

export function RecipesClient({ initialRecipes }: { initialRecipes: RecipeDTO[] }) {
  const {
    filteredRecipes,
    difficultyFilter,
    setDifficultyFilter,
    generateOpen,
    setGenerateOpen,
    handleGenerate,
    isGenerating,
    selectedRecipe,
    setSelectedRecipe,
    recipes,
  } = useRecipesPage(initialRecipes);

  const filters: Array<'All' | RecipeDTO['difficulty']> = ['All', ...DIFFICULTIES];

  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      {/* -- Header -- */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-linear-to-br from-green-500 to-emerald-700">
            <Sparkles aria-hidden="true" className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Recipe Suggestions</h1>
            <p className="text-sm text-muted-foreground">
              Describe what you want to cook and let AI build the recipe
            </p>
          </div>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700"
          type="button"
          onClick={() => setGenerateOpen(true)}
        >
          <Sparkles aria-hidden="true" className="size-4" />
          Generate Recipe
        </Button>
      </div>

      {/* -- Filters -- */}
      {recipes.length > 0 ? (
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {filters.map(filter => (
            <button
              key={filter}
              className={cn(
                'whitespace-nowrap rounded-lg px-4 py-2 transition-colors',
                difficultyFilter === filter
                  ? 'bg-green-600 text-white'
                  : 'border border-border bg-card text-muted-foreground hover:bg-muted',
              )}
              type="button"
              onClick={() => setDifficultyFilter(filter)}
            >
              {filter === 'All' ? 'All' : DIFFICULTY_LABELS[filter]}
            </button>
          ))}
        </div>
      ) : null}

      {/* -- Recipe grid / empty state -- */}
      {recipes.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <ChefHat aria-hidden="true" className="size-10 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">No recipes yet</p>
          <p className="text-sm text-muted-foreground">
            Generate your first AI recipe to get started!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
          ))}
        </div>
      )}

      <GenerateRecipeDialog
        isGenerating={isGenerating}
        open={generateOpen}
        onGenerate={handleGenerate}
        onOpenChange={setGenerateOpen}
      />
      <RecipeDetailDialog
        recipe={selectedRecipe}
        onOpenChange={open => {
          if (!open) setSelectedRecipe(null);
        }}
      />
    </main>
  );
}
