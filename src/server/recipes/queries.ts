import prisma from '@/lib/prisma';
import type { RecipeDTO } from '@/types/recipes';

export async function getRecipesByAuthorId(authorId: string) {
  return prisma.recipe.findMany({
    where: { authorId, deletedAt: null },
    include: { ingredients: { include: { ingredient: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

/** Ownership-scoped lookup for a single recipe — used by the "cook" flow to consume pantry stock. */
export async function getRecipeByIdAndAuthor(id: string, authorId: string) {
  return prisma.recipe.findFirst({
    where: { id, authorId, deletedAt: null },
    include: { ingredients: true },
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
      ingredientId: ri.ingredientId,
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
    })),
    createdAt: recipe.createdAt.toISOString(),
  };
}
