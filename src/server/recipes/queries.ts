import prisma from '@/lib/prisma';
import type { RecipeDTO } from '@/types/recipes';

export async function getRecipesByAuthorId(authorId: string) {
  return prisma.recipe.findMany({
    where: { authorId, deletedAt: null },
    include: { ingredients: { include: { ingredient: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

type RecipeWithIngredients = Awaited<ReturnType<typeof getRecipesByAuthorId>>[number];

/** Shared shaping used by the recipes page's Server Component and the generate action. */
export function toRecipeDTO(recipe: RecipeWithIngredients): RecipeDTO {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    instructions: Array.isArray(recipe.instructions) ? (recipe.instructions as string[]) : [],
    servings: recipe.servings,
    cookTimeMinutes: recipe.cookTimeMinutes,
    difficulty: recipe.difficulty,
    isAIGenerated: recipe.isAIGenerated,
    ingredients: recipe.ingredients.map(ri => ({
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
    })),
    createdAt: recipe.createdAt.toISOString(),
  };
}
