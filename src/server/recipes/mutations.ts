import type { IngredientCategory, RecipeDifficulty, UnitType } from '@prisma/client';

import prisma from '@/lib/prisma';
import { ingredientVisibilityFilter } from '@/server/ingredients/queries';

interface CreateRecipeIngredientInput {
  name: string;
  quantity: number;
  unit: UnitType;
  category: IngredientCategory;
}

interface CreateRecipeInput {
  title: string;
  description: string;
  servings: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  instructions: string[];
  ingredients: CreateRecipeIngredientInput[];
}

/**
 * Persists an AI-generated recipe and its ingredient lines in one transaction.
 * Ingredients are matched by case-insensitive name against the shared `Ingredient`
 * catalogue (also used by pantry/shopping) and created on first use.
 */
export async function createRecipe(authorId: string, input: CreateRecipeInput) {
  return prisma.$transaction(async tx => {
    // Dedupe by name first — two ingredient lines resolving to the same Ingredient row
    // (e.g. the model listing "Salt" twice) would otherwise collide on the
    // RecipeIngredient (recipeId, ingredientId) primary key.
    const seen = new Map<string, CreateRecipeIngredientInput>();
    for (const ing of input.ingredients) {
      const key = ing.name.trim().toLowerCase();
      if (!seen.has(key)) seen.set(key, ing);
    }
    const uniqueIngredients = [...seen.values()];

    const ingredientIds = await Promise.all(
      uniqueIngredients.map(async ing => {
        // Scoped to the shared catalog + this author's own private ingredients — never
        // matches (and so never exposes, via a recipe) another user's private ingredient.
        const existing = await tx.ingredient.findFirst({
          where: {
            ...ingredientVisibilityFilter(authorId),
            name: { equals: ing.name, mode: 'insensitive' },
          },
          select: { id: true },
        });
        if (existing) return existing.id;

        const created = await tx.ingredient.create({
          data: { name: ing.name, category: ing.category },
          select: { id: true },
        });
        return created.id;
      }),
    );

    return tx.recipe.create({
      data: {
        title: input.title,
        description: input.description,
        servings: input.servings,
        cookTimeMinutes: input.cookTimeMinutes,
        difficulty: input.difficulty,
        instructions: input.instructions,
        isAIGenerated: true,
        authorId,
        ingredients: {
          createMany: {
            data: uniqueIngredients.map((ing, i) => ({
              ingredientId: ingredientIds[i],
              quantity: ing.quantity,
              unit: ing.unit,
            })),
          },
        },
      },
      include: { ingredients: { include: { ingredient: true } } },
    });
  });
}
