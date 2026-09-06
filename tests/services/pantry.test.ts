import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/ingredients/queries', () => ({ getVisibleIngredientById: vi.fn() }));
vi.mock('@/server/ingredients/mutations', () => ({ findOrCreateIngredientForUser: vi.fn() }));
vi.mock('@/server/pantry/queries', () => ({
  getPantryItemByUserAndIngredient: vi.fn(),
  toPantryItemDTO: vi.fn(),
}));
vi.mock('@/server/pantry/mutations', () => ({
  createPantryItem: vi.fn(),
  incrementPantryItemQuantity: vi.fn(),
  updatePantryItem: vi.fn(),
  deletePantryItem: vi.fn(),
}));
vi.mock('@/server/recipes/queries', () => ({ getRecipeByIdAndAuthor: vi.fn() }));

import { findOrCreateIngredientForUser } from '@/server/ingredients/mutations';
import { getVisibleIngredientById } from '@/server/ingredients/queries';
import {
  createPantryItem,
  deletePantryItem,
  incrementPantryItemQuantity,
  updatePantryItem,
} from '@/server/pantry/mutations';
import { getPantryItemByUserAndIngredient, toPantryItemDTO } from '@/server/pantry/queries';
import { getRecipeByIdAndAuthor } from '@/server/recipes/queries';
import { addPantryItem, consumeRecipeIngredients, PantryError } from '@/services/pantry';
import type { PantryItemDTO } from '@/types/pantry';

const mockGetVisibleIngredientById = vi.mocked(getVisibleIngredientById);
const mockFindOrCreateIngredientForUser = vi.mocked(findOrCreateIngredientForUser);
const mockGetPantryItemByUserAndIngredient = vi.mocked(getPantryItemByUserAndIngredient);
const mockToPantryItemDTO = vi.mocked(toPantryItemDTO);
const mockCreatePantryItem = vi.mocked(createPantryItem);
const mockIncrementPantryItemQuantity = vi.mocked(incrementPantryItemQuantity);
const mockUpdatePantryItem = vi.mocked(updatePantryItem);
const mockDeletePantryItem = vi.mocked(deletePantryItem);
const mockGetRecipeByIdAndAuthor = vi.mocked(getRecipeByIdAndAuthor);

const INGREDIENT = { id: 'ingredient-1', name: 'Tomato', category: 'VEGETABLE', icon: '🍅' };
const RESULT_DTO = { id: 'pantry-item-1' } as unknown as PantryItemDTO;

beforeEach(() => {
  mockToPantryItemDTO.mockReturnValue(RESULT_DTO);
});

describe('addPantryItem', () => {
  it('throws PantryError when a submitted ingredientId is not visible to the user', async () => {
    mockGetVisibleIngredientById.mockResolvedValue(null);

    await expect(
      addPantryItem('user-1', {
        ingredientId: 'someone-elses-ingredient',
        quantity: 1,
        unit: 'PIECE',
      }),
    ).rejects.toThrow(PantryError);

    expect(mockFindOrCreateIngredientForUser).not.toHaveBeenCalled();
    expect(mockCreatePantryItem).not.toHaveBeenCalled();
    expect(mockIncrementPantryItemQuantity).not.toHaveBeenCalled();
  });

  it('finds-or-creates the ingredient when no ingredientId is given, then creates a new pantry row', async () => {
    // @ts-expect-error -- partial Prisma row is enough for this test
    mockFindOrCreateIngredientForUser.mockResolvedValue(INGREDIENT);
    mockGetPantryItemByUserAndIngredient.mockResolvedValue(null);
    // @ts-expect-error -- partial Prisma row is enough for this test
    mockCreatePantryItem.mockResolvedValue({ id: 'pantry-item-1' });

    const result = await addPantryItem('user-1', {
      name: 'Tomato',
      category: 'VEGETABLE',
      icon: '🍅',
      quantity: 5,
      unit: 'PIECE',
    });

    expect(mockFindOrCreateIngredientForUser).toHaveBeenCalledWith('user-1', {
      name: 'Tomato',
      category: 'VEGETABLE',
      icon: '🍅',
    });
    expect(mockCreatePantryItem).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', ingredientId: 'ingredient-1', quantity: 5 }),
    );
    expect(mockIncrementPantryItemQuantity).not.toHaveBeenCalled();
    expect(result).toBe(RESULT_DTO);
  });

  it('increments the existing pantry row instead of erroring when the user already has this ingredient', async () => {
    mockGetVisibleIngredientById.mockResolvedValue(
      // @ts-expect-error -- partial Prisma row is enough for this test
      INGREDIENT,
    );
    mockGetPantryItemByUserAndIngredient.mockResolvedValue(
      // @ts-expect-error -- partial Prisma row is enough for this test
      { id: 'existing-pantry-item', quantity: 3 },
    );
    // @ts-expect-error -- partial Prisma row is enough for this test
    mockIncrementPantryItemQuantity.mockResolvedValue({ id: 'existing-pantry-item' });

    const result = await addPantryItem('user-1', {
      ingredientId: 'ingredient-1',
      quantity: 2,
      unit: 'PIECE',
    });

    expect(mockIncrementPantryItemQuantity).toHaveBeenCalledWith('existing-pantry-item', 2, null);
    expect(mockCreatePantryItem).not.toHaveBeenCalled();
    expect(result).toBe(RESULT_DTO);
  });
});

const recipeWithIngredients = (
  ingredients: Array<{ ingredientId: string; quantity: number; unit: string }>,
) =>
  ({ ingredients }) as unknown as NonNullable<Awaited<ReturnType<typeof getRecipeByIdAndAuthor>>>;

const pantryRow = (row: { id: string; quantity: number; unit: string }) =>
  row as unknown as NonNullable<Awaited<ReturnType<typeof getPantryItemByUserAndIngredient>>>;

describe('consumeRecipeIngredients', () => {
  it('throws PantryError when the recipe does not exist (or is not owned by the user)', async () => {
    mockGetRecipeByIdAndAuthor.mockResolvedValue(null);

    await expect(consumeRecipeIngredients('user-1', 'recipe-1')).rejects.toThrow(PantryError);
    expect(mockGetPantryItemByUserAndIngredient).not.toHaveBeenCalled();
  });

  it('deletes the pantry row once its quantity would drop to zero or below', async () => {
    mockGetRecipeByIdAndAuthor.mockResolvedValue(
      recipeWithIngredients([{ ingredientId: 'ingredient-1', quantity: 3, unit: 'PIECE' }]),
    );
    mockGetPantryItemByUserAndIngredient.mockResolvedValue(
      pantryRow({ id: 'pantry-item-1', quantity: 3, unit: 'PIECE' }),
    );

    const result = await consumeRecipeIngredients('user-1', 'recipe-1');

    expect(mockDeletePantryItem).toHaveBeenCalledWith('pantry-item-1');
    expect(mockUpdatePantryItem).not.toHaveBeenCalled();
    expect(result).toEqual({ consumedCount: 1, skippedCount: 0 });
  });

  it('decrements the pantry row when some quantity remains', async () => {
    mockGetRecipeByIdAndAuthor.mockResolvedValue(
      recipeWithIngredients([{ ingredientId: 'ingredient-1', quantity: 2, unit: 'PIECE' }]),
    );
    mockGetPantryItemByUserAndIngredient.mockResolvedValue(
      pantryRow({ id: 'pantry-item-1', quantity: 5, unit: 'PIECE' }),
    );

    const result = await consumeRecipeIngredients('user-1', 'recipe-1');

    expect(mockUpdatePantryItem).toHaveBeenCalledWith('pantry-item-1', { quantity: 3 });
    expect(mockDeletePantryItem).not.toHaveBeenCalled();
    expect(result).toEqual({ consumedCount: 1, skippedCount: 0 });
  });

  it('leaves the pantry row untouched when there is none, or its unit is from a different family', async () => {
    mockGetRecipeByIdAndAuthor.mockResolvedValue(
      recipeWithIngredients([
        { ingredientId: 'missing-ingredient', quantity: 1, unit: 'PIECE' },
        { ingredientId: 'incompatible-unit-ingredient', quantity: 1, unit: 'GRAM' },
      ]),
    );
    mockGetPantryItemByUserAndIngredient.mockImplementation(async (_userId, ingredientId) =>
      // Recipe wants grams (mass), pantry logs this ingredient in pieces (count) —
      // there's no way to convert between those without per-ingredient density data.
      ingredientId === 'incompatible-unit-ingredient'
        ? pantryRow({ id: 'pantry-item-2', quantity: 5, unit: 'PIECE' })
        : null,
    );

    const result = await consumeRecipeIngredients('user-1', 'recipe-1');

    expect(mockUpdatePantryItem).not.toHaveBeenCalled();
    expect(mockDeletePantryItem).not.toHaveBeenCalled();
    expect(result).toEqual({ consumedCount: 0, skippedCount: 2 });
  });

  it('converts the recipe quantity into the pantry row unit before subtracting', async () => {
    mockGetRecipeByIdAndAuthor.mockResolvedValue(
      recipeWithIngredients([{ ingredientId: 'rice', quantity: 500, unit: 'GRAM' }]),
    );
    mockGetPantryItemByUserAndIngredient.mockResolvedValue(
      pantryRow({ id: 'pantry-item-4', quantity: 2, unit: 'KILOGRAM' }),
    );

    const result = await consumeRecipeIngredients('user-1', 'recipe-1');

    expect(mockUpdatePantryItem).toHaveBeenCalledWith('pantry-item-4', { quantity: 1.5 });
    expect(result).toEqual({ consumedCount: 1, skippedCount: 0 });
  });

  it('consumes the substituted pantry ingredient instead of the recipe line’s own id', async () => {
    mockGetRecipeByIdAndAuthor.mockResolvedValue(
      recipeWithIngredients([{ ingredientId: 'white-rice', quantity: 200, unit: 'GRAM' }]),
    );
    mockGetPantryItemByUserAndIngredient.mockImplementation(async (_userId, ingredientId) =>
      ingredientId === 'rice'
        ? pantryRow({ id: 'pantry-item-5', quantity: 500, unit: 'GRAM' })
        : null,
    );

    const result = await consumeRecipeIngredients('user-1', 'recipe-1', { 'white-rice': 'rice' });

    expect(mockGetPantryItemByUserAndIngredient).toHaveBeenCalledWith('user-1', 'rice');
    expect(mockUpdatePantryItem).toHaveBeenCalledWith('pantry-item-5', { quantity: 300 });
    expect(result).toEqual({ consumedCount: 1, skippedCount: 0 });
  });

  it('reports a mixed outcome — some ingredients consumed, some skipped — rather than failing', async () => {
    mockGetRecipeByIdAndAuthor.mockResolvedValue(
      recipeWithIngredients([
        { ingredientId: 'has-it', quantity: 1, unit: 'PIECE' },
        { ingredientId: 'lacks-it', quantity: 1, unit: 'PIECE' },
      ]),
    );
    mockGetPantryItemByUserAndIngredient.mockImplementation(async (_userId, ingredientId) =>
      ingredientId === 'has-it'
        ? pantryRow({ id: 'pantry-item-3', quantity: 1, unit: 'PIECE' })
        : null,
    );

    const result = await consumeRecipeIngredients('user-1', 'recipe-1');

    expect(mockDeletePantryItem).toHaveBeenCalledWith('pantry-item-3');
    expect(result).toEqual({ consumedCount: 1, skippedCount: 1 });
  });

  it('succeeds as a no-op when the recipe has no ingredients at all', async () => {
    mockGetRecipeByIdAndAuthor.mockResolvedValue(recipeWithIngredients([]));

    const result = await consumeRecipeIngredients('user-1', 'recipe-1');

    expect(mockGetPantryItemByUserAndIngredient).not.toHaveBeenCalled();
    expect(result).toEqual({ consumedCount: 0, skippedCount: 0 });
  });
});
