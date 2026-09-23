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

interface RecipeWriteInput {
  title: string;
  description: string | null;
  servings: number;
  cookTimeMinutes: number;
  difficulty: RecipeDifficulty;
  instructions: string[];
  /** Already-resolved catalogue rows — see `services/recipes.ts`. */
  ingredients: Array<{ ingredientId: string; quantity: number; unit: UnitType }>;
}

/** Persists a user-written recipe. Unlike `createRecipe`, ingredients are already resolved to ids. */
export async function createCustomRecipe(authorId: string, input: RecipeWriteInput) {
  return prisma.recipe.create({
    data: {
      title: input.title,
      description: input.description,
      servings: input.servings,
      cookTimeMinutes: input.cookTimeMinutes,
      difficulty: input.difficulty,
      instructions: input.instructions,
      isAIGenerated: false,
      authorId,
      ingredients: { createMany: { data: input.ingredients } },
    },
    include: { ingredients: { include: { ingredient: true } } },
  });
}

/**
 * Replaces a recipe's fields and its whole ingredient list in one transaction. Scoped to
 * the author; returns `null` when the recipe doesn't exist or isn't theirs. `isAIGenerated`
 * is left as-is (it records where the recipe came from, not whether it was later edited),
 * and planned meals keep pointing at the same recipe id.
 */
export async function updateRecipeByAuthor(id: string, authorId: string, input: RecipeWriteInput) {
  return prisma.$transaction(async tx => {
    const owned = await tx.recipe.findFirst({
      where: { id, authorId, deletedAt: null },
      select: { id: true },
    });
    if (!owned) return null;

    return tx.recipe.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        servings: input.servings,
        cookTimeMinutes: input.cookTimeMinutes,
        difficulty: input.difficulty,
        instructions: input.instructions,
        ingredients: { deleteMany: {}, createMany: { data: input.ingredients } },
      },
      include: { ingredients: { include: { ingredient: true } } },
    });
  });
}

/**
 * Soft-deletes a recipe (sets `deletedAt`) so already-cooked meals keep their history,
 * and drops its not-yet-cooked planned meals so the planner never shows a dead recipe.
 * Scoped to the author; returns `false` when the recipe doesn't exist or isn't theirs.
 */
export async function softDeleteRecipeByAuthor(id: string, authorId: string) {
  return prisma.$transaction(async tx => {
    const owned = await tx.recipe.findFirst({
      where: { id, authorId, deletedAt: null },
      select: { id: true },
    });
    if (!owned) return false;

    await tx.mealPlan.deleteMany({ where: { recipeId: id, cookedAt: null } });
    await tx.recipe.update({ where: { id }, data: { deletedAt: new Date() } });
    return true;
  });
}
