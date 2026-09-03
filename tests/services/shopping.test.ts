import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config', () => ({
  DATABASE_URL: 'postgres://test',
  NEXTAUTH_URL: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'test-secret',
  GEMINI_API_KEY: 'test-api-key',
}));
vi.mock('@/server/shopping/queries/category', () => ({ getCategoryByIdAndUser: vi.fn() }));
vi.mock('@/server/shopping/queries/list', () => ({ getShoppingListByIdAndOwner: vi.fn() }));
vi.mock('@/server/shopping/mutations/list', () => ({ getOrCreateDefaultShoppingList: vi.fn() }));
vi.mock('@/server/shopping/mutations/item', () => ({
  createItem: vi.fn(),
  clearCheckedItems: vi.fn(),
}));
vi.mock('@/server/shopping/queries/item', () => ({ getCheckedItemsByShoppingListId: vi.fn() }));
vi.mock('@/services/ingredients', async () => {
  const actual = await vi.importActual('@/services/ingredients');
  return { ...actual, resolveOrCreateIngredient: vi.fn() };
});
vi.mock('@/services/pantry', () => ({ addPantryItem: vi.fn() }));

import { clearCheckedItems, createItem } from '@/server/shopping/mutations/item';
import { getOrCreateDefaultShoppingList } from '@/server/shopping/mutations/list';
import { getCategoryByIdAndUser } from '@/server/shopping/queries/category';
import { getCheckedItemsByShoppingListId } from '@/server/shopping/queries/item';
import { getShoppingListByIdAndOwner } from '@/server/shopping/queries/list';
import { IngredientResolutionError, resolveOrCreateIngredient } from '@/services/ingredients';
import { addPantryItem } from '@/services/pantry';
import { addShoppingItem, completeCheckedItems, ShoppingError } from '@/services/shopping';

const mockGetCategoryByIdAndUser = vi.mocked(getCategoryByIdAndUser);
const mockGetShoppingListByIdAndOwner = vi.mocked(getShoppingListByIdAndOwner);
const mockGetOrCreateDefaultShoppingList = vi.mocked(getOrCreateDefaultShoppingList);
const mockCreateItem = vi.mocked(createItem);
const mockClearCheckedItems = vi.mocked(clearCheckedItems);
const mockGetCheckedItemsByShoppingListId = vi.mocked(getCheckedItemsByShoppingListId);
const mockResolveOrCreateIngredient = vi.mocked(resolveOrCreateIngredient);
const mockAddPantryItem = vi.mocked(addPantryItem);

const LIST = { id: 'list-1' };
const CATEGORY = { id: 'category-1' };
const INGREDIENT = { id: 'ingredient-1' };

function makeShoppingListItemRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    shoppingListId: 'list-1',
    categoryId: 'category-1',
    ingredientId: 'ingredient-1',
    name: 'Tomato',
    quantity: 3,
    unit: 'PIECE',
    notes: null,
    checked: false,
    source: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

beforeEach(() => {
  // @ts-expect-error -- partial Prisma row is enough for these tests
  mockGetOrCreateDefaultShoppingList.mockResolvedValue(LIST);
  // @ts-expect-error -- partial Prisma row is enough for these tests
  mockGetShoppingListByIdAndOwner.mockResolvedValue(LIST);
  // @ts-expect-error -- partial Prisma row is enough for these tests
  mockGetCategoryByIdAndUser.mockResolvedValue(CATEGORY);
  // @ts-expect-error -- partial Prisma row is enough for these tests
  mockResolveOrCreateIngredient.mockResolvedValue(INGREDIENT);
});

describe('addShoppingItem', () => {
  it('creates the item with a picked ingredient', async () => {
    // @ts-expect-error -- partial Prisma row is enough for this test
    mockCreateItem.mockResolvedValue(makeShoppingListItemRow());

    const result = await addShoppingItem('user-1', {
      name: 'Tomato',
      categoryId: 'category-1',
      quantity: 3,
      unit: 'PIECE',
      ingredientId: 'ingredient-1',
    });

    expect(mockResolveOrCreateIngredient).toHaveBeenCalledWith('user-1', {
      ingredientId: 'ingredient-1',
      name: 'Tomato',
      category: undefined,
      icon: undefined,
    });
    expect(mockCreateItem).toHaveBeenCalledWith(
      expect.objectContaining({ ingredientId: 'ingredient-1', shoppingListId: 'list-1' }),
    );
    expect(result.name).toBe('Tomato');
  });

  it('creates the item with a newly-created ingredient', async () => {
    // @ts-expect-error -- partial Prisma row is enough for this test
    mockCreateItem.mockResolvedValue(makeShoppingListItemRow());

    await addShoppingItem('user-1', {
      name: 'Kiwi',
      categoryId: 'category-1',
      quantity: 1,
      unit: 'PIECE',
      ingredientCategory: 'FRUIT',
      ingredientIcon: '🥝',
    });

    expect(mockResolveOrCreateIngredient).toHaveBeenCalledWith('user-1', {
      ingredientId: undefined,
      name: 'Kiwi',
      category: 'FRUIT',
      icon: '🥝',
    });
  });

  it('throws ShoppingError when the list is not found', async () => {
    mockGetShoppingListByIdAndOwner.mockResolvedValue(null);

    await expect(
      addShoppingItem('user-1', {
        name: 'Tomato',
        categoryId: 'category-1',
        quantity: 1,
        unit: 'PIECE',
        listId: 'someone-elses-list',
        ingredientId: 'ingredient-1',
      }),
    ).rejects.toThrow(ShoppingError);

    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it('throws ShoppingError when the category is not found', async () => {
    mockGetCategoryByIdAndUser.mockResolvedValue(null);

    await expect(
      addShoppingItem('user-1', {
        name: 'Tomato',
        categoryId: 'missing-category',
        quantity: 1,
        unit: 'PIECE',
        ingredientId: 'ingredient-1',
      }),
    ).rejects.toThrow(ShoppingError);

    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it('wraps an ingredient resolution failure into a ShoppingError', async () => {
    mockResolveOrCreateIngredient.mockRejectedValue(
      new IngredientResolutionError('Ingredient not found'),
    );

    await expect(
      addShoppingItem('user-1', {
        name: 'Tomato',
        categoryId: 'category-1',
        quantity: 1,
        unit: 'PIECE',
        ingredientId: 'someone-elses-ingredient',
      }),
    ).rejects.toThrow(ShoppingError);

    expect(mockCreateItem).not.toHaveBeenCalled();
  });
});

describe('completeCheckedItems', () => {
  it('adds each checked item to the pantry, using its ingredientId when present', async () => {
    mockGetCheckedItemsByShoppingListId.mockResolvedValue([
      // @ts-expect-error -- partial Prisma row is enough for this test
      makeShoppingListItemRow({ id: 'item-1', ingredientId: 'ingredient-1', name: 'Tomato' }),
    ]);

    const result = await completeCheckedItems('user-1', 'list-1');

    expect(mockAddPantryItem).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({
        ingredientId: 'ingredient-1',
        name: undefined,
        category: undefined,
      }),
    );
    expect(mockClearCheckedItems).toHaveBeenCalledWith('list-1');
    expect(result).toEqual({ addedCount: 1 });
  });

  it('falls back to the OTHER category by name for a legacy item with no ingredientId', async () => {
    mockGetCheckedItemsByShoppingListId.mockResolvedValue([
      // @ts-expect-error -- partial Prisma row is enough for this test
      makeShoppingListItemRow({ id: 'item-2', ingredientId: null, name: 'Napkins' }),
    ]);

    await completeCheckedItems('user-1', 'list-1');

    expect(mockAddPantryItem).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ ingredientId: undefined, name: 'Napkins', category: 'OTHER' }),
    );
  });

  it('is a no-op when there are no checked items', async () => {
    mockGetCheckedItemsByShoppingListId.mockResolvedValue([]);

    const result = await completeCheckedItems('user-1', 'list-1');

    expect(mockAddPantryItem).not.toHaveBeenCalled();
    expect(result).toEqual({ addedCount: 0 });
  });

  it('throws ShoppingError when the list is not found', async () => {
    mockGetShoppingListByIdAndOwner.mockResolvedValue(null);

    await expect(completeCheckedItems('user-1', 'someone-elses-list')).rejects.toThrow(
      ShoppingError,
    );

    expect(mockGetCheckedItemsByShoppingListId).not.toHaveBeenCalled();
  });
});
