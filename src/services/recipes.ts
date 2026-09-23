import type { SaveRecipeInput } from '@/lib/schemas/recipes';
import {
  createCustomRecipe,
  softDeleteRecipeByAuthor,
  updateRecipeByAuthor,
} from '@/server/recipes/mutations';
import { getRecipeByIdAndAuthor, toRecipeDTO } from '@/server/recipes/queries';
import { resolveOrCreateIngredient } from '@/services/ingredients';
import type { RecipeDTO } from '@/types/recipes';

/** Expected, user-facing failure — actions surface `message` verbatim. */
export class RecipeError extends Error {}

/**
 * Resolves each submitted line to a visible (shared or the user's own) ingredient —
 * creating private ones for new names — and rejects a recipe that lists the same
 * ingredient twice, which the (recipeId, ingredientId) primary key couldn't store anyway.
 * Resolved sequentially: two new lines with the same name must find-or-create the same row.
 */
async function toWriteInput(userId: string, input: SaveRecipeInput) {
  const ingredients: Array<{
    ingredientId: string;
    quantity: number;
    unit: SaveRecipeInput['ingredients'][number]['unit'];
  }> = [];
  const seen = new Set<string>();

  for (const line of input.ingredients) {
    const ingredient = await resolveOrCreateIngredient(userId, {
      ingredientId: line.ingredientId,
      name: line.name ?? '',
      category: line.category,
      icon: line.icon,
    });
    if (seen.has(ingredient.id)) {
      throw new RecipeError(`"${ingredient.name}" is listed more than once`);
    }
    seen.add(ingredient.id);
    ingredients.push({ ingredientId: ingredient.id, quantity: line.quantity, unit: line.unit });
  }

  return {
    title: input.title,
    description: input.description || null,
    servings: input.servings,
    cookTimeMinutes: input.cookTimeMinutes,
    difficulty: input.difficulty,
    instructions: input.instructions,
    ingredients,
  };
}

export async function createUserRecipe(userId: string, input: SaveRecipeInput): Promise<RecipeDTO> {
  const saved = await createCustomRecipe(userId, await toWriteInput(userId, input));
  return toRecipeDTO(saved);
}

export async function updateUserRecipe(
  userId: string,
  recipeId: string,
  input: SaveRecipeInput,
): Promise<RecipeDTO> {
  const saved = await updateRecipeByAuthor(recipeId, userId, await toWriteInput(userId, input));
  if (!saved) throw new RecipeError('Recipe not found');
  return toRecipeDTO(saved);
}

export async function deleteUserRecipe(userId: string, recipeId: string): Promise<void> {
  const deleted = await softDeleteRecipeByAuthor(recipeId, userId);
  if (!deleted) throw new RecipeError('Recipe not found');
}

const MAX_TITLE_LENGTH = 120;
const COPY_SUFFIX = ' (copy)';

/**
 * Duplicates a recipe the user owns into a new, independent one they can then edit freely.
 * The copy counts as hand-written (`isAIGenerated: false`) — it's the user's own version now.
 */
export async function cloneUserRecipe(userId: string, recipeId: string): Promise<RecipeDTO> {
  const source = await getRecipeByIdAndAuthor(recipeId, userId);
  if (!source) throw new RecipeError('Recipe not found');

  const saved = await createCustomRecipe(userId, {
    title: source.title.slice(0, MAX_TITLE_LENGTH - COPY_SUFFIX.length) + COPY_SUFFIX,
    description: source.description,
    servings: source.servings,
    cookTimeMinutes: source.cookTimeMinutes,
    difficulty: source.difficulty,
    instructions: Array.isArray(source.instructions) ? (source.instructions as string[]) : [],
    ingredients: source.ingredients.map(i => ({
      ingredientId: i.ingredientId,
      quantity: i.quantity,
      unit: i.unit,
    })),
  });
  return toRecipeDTO(saved);
}
