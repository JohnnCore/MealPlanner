import { ChefHat, Clock, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cardGradientFor, DIFFICULTY_BADGE_CLASS, DIFFICULTY_LABELS } from '@/lib/recipe-constants';
import { cn } from '@/lib/utils';
import type { RecipeDTO } from '@/types/recipes';

interface RecipeCardProps {
  recipe: RecipeDTO;
  onClick: () => void;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <button
      className="flex flex-col overflow-hidden rounded-xl border border-border bg-card text-left transition-shadow hover:shadow-md"
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
        <h3 className="font-semibold leading-tight">{recipe.title}</h3>

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
  );
}
