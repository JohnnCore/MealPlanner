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
}));

import { findOrCreateIngredientForUser } from '@/server/ingredients/mutations';
import { getVisibleIngredientById } from '@/server/ingredients/queries';
import { createPantryItem, incrementPantryItemQuantity } from '@/server/pantry/mutations';
import { getPantryItemByUserAndIngredient, toPantryItemDTO } from '@/server/pantry/queries';
import { addPantryItem, PantryError } from '@/services/pantry';
import type { PantryItemDTO } from '@/types/pantry';

const mockGetVisibleIngredientById = vi.mocked(getVisibleIngredientById);
const mockFindOrCreateIngredientForUser = vi.mocked(findOrCreateIngredientForUser);
const mockGetPantryItemByUserAndIngredient = vi.mocked(getPantryItemByUserAndIngredient);
const mockToPantryItemDTO = vi.mocked(toPantryItemDTO);
const mockCreatePantryItem = vi.mocked(createPantryItem);
const mockIncrementPantryItemQuantity = vi.mocked(incrementPantryItemQuantity);

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
