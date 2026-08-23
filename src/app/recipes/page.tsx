import { requireUserId } from '@/lib/auth-server';
import { getRecipesByAuthorId, toRecipeDTO } from '@/server/recipes/queries';

import { RecipesClient } from './RecipesClient';

export default async function RecipesPage() {
  const userId = await requireUserId();
  const recipes = await getRecipesByAuthorId(userId);

  return <RecipesClient initialRecipes={recipes.map(toRecipeDTO)} />;
}
