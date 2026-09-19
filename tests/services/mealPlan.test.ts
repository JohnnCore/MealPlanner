import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/server/mealPlan/mutations', () => ({
  upsertMealPlanSlot: vi.fn(),
  moveMealPlan: vi.fn(),
  markMealPlanCooked: vi.fn(),
}));
vi.mock('@/server/mealPlan/queries', () => ({
  getMealPlanByIdAndUser: vi.fn(),
  getMealPlanBySlot: vi.fn(),
  toMealPlanDTO: vi.fn((mealPlan: unknown) => mealPlan),
}));
vi.mock('@/server/recipes/queries', () => ({ getRecipeByIdAndAuthor: vi.fn() }));

import { markMealPlanCooked, moveMealPlan, upsertMealPlanSlot } from '@/server/mealPlan/mutations';
import { getMealPlanByIdAndUser, getMealPlanBySlot } from '@/server/mealPlan/queries';
import { getRecipeByIdAndAuthor } from '@/server/recipes/queries';
import {
  assertMealPlanCookable,
  markMealCooked,
  MealPlanError,
  moveMeal,
  planMeal,
} from '@/services/mealPlan';

const mockGetRecipe = vi.mocked(getRecipeByIdAndAuthor);
const mockGetById = vi.mocked(getMealPlanByIdAndUser);
const mockGetBySlot = vi.mocked(getMealPlanBySlot);
const mockUpsert = vi.mocked(upsertMealPlanSlot);
const mockMove = vi.mocked(moveMealPlan);
const mockMarkCooked = vi.mocked(markMealPlanCooked);

const SLOT = { date: '2026-09-15', mealType: 'DINNER' } as const;
// Only the fields the service reads — the mocked queries return this shape.
const plan = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'plan-1', recipeId: 'recipe-1', cookedAt: null, ...overrides }) as never;

beforeEach(() => {
  mockGetBySlot.mockResolvedValue(null);
});

describe('planMeal', () => {
  it('plans the recipe with its own servings and never needs the pantry', async () => {
    mockGetRecipe.mockResolvedValue({ id: 'recipe-1', servings: 4 } as never);
    mockUpsert.mockResolvedValue(plan() as never);

    await planMeal('user-1', 'recipe-1', SLOT);

    expect(mockUpsert).toHaveBeenCalledWith({
      userId: 'user-1',
      recipeId: 'recipe-1',
      dateKey: '2026-09-15',
      mealType: 'DINNER',
      servings: 4,
    });
  });

  it("rejects a recipe the user doesn't own", async () => {
    mockGetRecipe.mockResolvedValue(null);

    await expect(planMeal('user-1', 'recipe-x', SLOT)).rejects.toBeInstanceOf(MealPlanError);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('refuses to replace a cooked meal', async () => {
    mockGetRecipe.mockResolvedValue({ id: 'recipe-1', servings: 2 } as never);
    mockGetBySlot.mockResolvedValue(plan({ cookedAt: new Date() }));

    await expect(planMeal('user-1', 'recipe-1', SLOT)).rejects.toThrow(/already cooked/);
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});

describe('moveMeal', () => {
  it('moves an uncooked meal into a free slot', async () => {
    mockGetById.mockResolvedValue(plan());
    mockMove.mockResolvedValue(plan() as never);

    await moveMeal('user-1', 'plan-1', SLOT);

    expect(mockMove).toHaveBeenCalledWith('plan-1', {
      userId: 'user-1',
      dateKey: '2026-09-15',
      mealType: 'DINNER',
    });
  });

  it("rejects a plan that isn't the user's", async () => {
    mockGetById.mockResolvedValue(null);

    await expect(moveMeal('user-1', 'plan-1', SLOT)).rejects.toBeInstanceOf(MealPlanError);
    expect(mockMove).not.toHaveBeenCalled();
  });

  it('locks a cooked meal in place', async () => {
    mockGetById.mockResolvedValue(plan({ cookedAt: new Date() }));

    await expect(moveMeal('user-1', 'plan-1', SLOT)).rejects.toThrow(/already cooked/);
    expect(mockMove).not.toHaveBeenCalled();
  });

  it('refuses to replace a cooked meal in the target slot', async () => {
    mockGetById.mockResolvedValue(plan());
    mockGetBySlot.mockResolvedValue(plan({ id: 'plan-2', cookedAt: new Date() }));

    await expect(moveMeal('user-1', 'plan-1', SLOT)).rejects.toThrow(/already cooked/);
    expect(mockMove).not.toHaveBeenCalled();
  });
});

describe('cooking a planned meal', () => {
  it('is cookable when it matches the recipe and is not cooked yet', async () => {
    mockGetById.mockResolvedValue(plan());

    await expect(assertMealPlanCookable('user-1', 'plan-1', 'recipe-1')).resolves.toBeUndefined();
  });

  it('rejects a plan for a different recipe', async () => {
    mockGetById.mockResolvedValue(plan({ recipeId: 'recipe-2' }));

    await expect(assertMealPlanCookable('user-1', 'plan-1', 'recipe-1')).rejects.toBeInstanceOf(
      MealPlanError,
    );
  });

  it("can't be cooked twice", async () => {
    mockGetById.mockResolvedValue(plan({ cookedAt: new Date() }));

    await expect(assertMealPlanCookable('user-1', 'plan-1', 'recipe-1')).rejects.toThrow(
      /already cooked/,
    );
  });

  it('marks the plan cooked', async () => {
    mockGetById.mockResolvedValue(plan());
    mockMarkCooked.mockResolvedValue(plan() as never);

    await markMealCooked('user-1', 'plan-1');

    expect(mockMarkCooked).toHaveBeenCalledWith('plan-1');
  });
});
