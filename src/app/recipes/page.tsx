import { requireUserId } from '@/lib/auth-server';
import { getUserDietaryProfile } from '@/server/profile/queries';
import { getRecipesByAuthorId, toRecipeDTO } from '@/server/recipes/queries';

import { RecipesClient } from './RecipesClient';

export default async function RecipesPage() {
  const userId = await requireUserId();
  const [recipes, dietaryProfile] = await Promise.all([
    getRecipesByAuthorId(userId),
    getUserDietaryProfile(userId),
  ]);

  return (
    <RecipesClient
      dietarySummary={{
        defaultServings: dietaryProfile?.defaultServings ?? 1,
        dietType: dietaryProfile?.dietType ?? 'OMNIVORE',
        allergyNames: dietaryProfile?.allergyNames ?? [],
      }}
      initialRecipes={recipes.map(toRecipeDTO)}
    />
  );
}
