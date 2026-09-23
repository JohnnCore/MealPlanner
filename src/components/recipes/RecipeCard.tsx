import { ChefHat, Clock, PenLine, Sparkles, Users } from 'lucide-react';

import { RecipeActionsMenu } from '@/components/recipes/RecipeActionsMenu';
import { Badge } from '@/components/ui/badge';
import { DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABELS } from '@/constants/recipe';
import { cn } from '@/lib/utils';
import type { RecipeDTO } from '@/types/recipes';
import { cardGradientFor } from '@/utils/recipe';

interface RecipeCardProps {
  recipe: RecipeDTO;
  onClick: () => void;
  onEdit: (recipe: RecipeDTO) => void;
  onClone: (recipe: RecipeDTO) => void;
  onDelete: (recipe: RecipeDTO) => void;
}

export function RecipeCard({ recipe, onClick, onEdit, onClone, onDelete }: RecipeCardProps) {
  return (
    <div className="relative flex">
      <button
        className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-md"
        type="button"
        onClick={onClick}
      >
        <div
          className={cn(
            'relative flex h-32 items-center justify-center bg-linear-to-br',
            cardGradientFor(recipe.id),
          )}
        >
          <ChefHat aria-hidden="true" className="size-10 text-white/90" />
          <Badge
            className={cn(
              'absolute top-3 left-3 font-semibold',
              DIFFICULTY_BADGE_CLASS[recipe.difficulty],
            )}
          >
            {DIFFICULTY_LABELS[recipe.difficulty]}
          </Badge>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{recipe.title}</h3>
            <Badge className="shrink-0 gap-1" variant="secondary">
              {recipe.isAIGenerated ? (
                <Sparkles aria-hidden="true" className="size-3" />
              ) : (
                <PenLine aria-hidden="true" className="size-3" />
              )}
              {recipe.isAIGenerated ? 'AI' : 'Custom'}
            </Badge>
          </div>

          {recipe.description ? (
            <p className="line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
          ) : null}

          <div className="mt-auto flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-4" />
              {recipe.cookTimeMinutes} min
            </span>
            <span className="flex items-center gap-1.5">
              <Users aria-hidden="true" className="size-4" />
              {recipe.servings} servings
            </span>
          </div>
        </div>
      </button>
      <RecipeActionsMenu
        className="absolute top-3 right-3 size-8"
        recipe={recipe}
        onClone={onClone}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </div>
  );
}
