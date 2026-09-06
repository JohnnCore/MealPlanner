import { describe, expect, it } from 'vitest';

import type { PantryItemDTO } from '@/types/pantry';
import type { RecipeIngredientDTO } from '@/types/recipes';
import {
  applyPossibleMatchSelection,
  getIngredientAvailability,
  suggestedShoppingQuantity,
} from '@/utils/recipe';

function pantryItem(overrides: Partial<PantryItemDTO> & { ingredientId: string }): PantryItemDTO {
  return {
    id: `pantry-${overrides.ingredientId}`,
    name: 'Item',
    icon: '🥘',
    category: 'OTHER',
    quantity: 1,
    unit: 'PIECE',
    expiresAt: null,
    freshnessPercent: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function recipeIngredient(
  overrides: Partial<RecipeIngredientDTO> & { ingredientId: string },
): RecipeIngredientDTO {
  return {
    name: 'Ingredient',
    quantity: 1,
    unit: 'PIECE',
    ...overrides,
  };
}

describe('getIngredientAvailability', () => {
  it('marks an ingredient AVAILABLE when the matching pantry row has enough, same unit', () => {
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'rice', name: 'Rice', quantity: 200, unit: 'GRAM' })],
      [pantryItem({ ingredientId: 'rice', name: 'Rice', quantity: 500, unit: 'GRAM' })],
    );

    expect(result.status).toBe('AVAILABLE');
    expect(result.pantryQuantity).toBe(500);
  });

  it('marks an ingredient INSUFFICIENT when the pantry row has less than required, same unit', () => {
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'rice', name: 'Rice', quantity: 200, unit: 'GRAM' })],
      [pantryItem({ ingredientId: 'rice', name: 'Rice', quantity: 50, unit: 'GRAM' })],
    );

    expect(result.status).toBe('INSUFFICIENT');
  });

  it('converts across units in the same family before comparing quantities', () => {
    const [available] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'rice', name: 'Rice', quantity: 200, unit: 'GRAM' })],
      [pantryItem({ ingredientId: 'rice', name: 'Rice', quantity: 1, unit: 'KILOGRAM' })],
    );
    expect(available.status).toBe('AVAILABLE');

    const [insufficient] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'rice', name: 'Rice', quantity: 2, unit: 'KILOGRAM' })],
      [pantryItem({ ingredientId: 'rice', name: 'Rice', quantity: 500, unit: 'GRAM' })],
    );
    expect(insufficient.status).toBe('INSUFFICIENT');
  });

  it('falls back to AVAILABLE when the matching ingredient is logged in an incompatible unit family', () => {
    // Pantry logs this in grams (mass) but the recipe needs pieces (count) — there's no
    // way to compare those without per-ingredient density data this app doesn't have.
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'lemon', name: 'Lemon', quantity: 2, unit: 'PIECE' })],
      [pantryItem({ ingredientId: 'lemon', name: 'Lemon', quantity: 500, unit: 'GRAM' })],
    );

    expect(result.status).toBe('AVAILABLE');
  });

  it('marks an ingredient MISSING when nothing in the pantry matches by id or name', () => {
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'saffron', name: 'Saffron' })],
      [pantryItem({ ingredientId: 'rice', name: 'Rice' })],
    );

    expect(result.status).toBe('MISSING');
    expect(result.possibleMatches).toBeUndefined();
  });

  it('falls back to a POSSIBLE_MATCH when a recipe ingredient has a qualifier the pantry name lacks', () => {
    // AI-generated recipes dedupe ingredients by exact case-insensitive name, so "white
    // rice" resolves to a different Ingredient row than a pantry item named just "Rice".
    const [result] = getIngredientAvailability(
      [
        recipeIngredient({
          ingredientId: 'white-rice',
          name: 'White Rice',
          quantity: 200,
          unit: 'GRAM',
        }),
      ],
      [pantryItem({ ingredientId: 'rice', name: 'Rice', quantity: 500, unit: 'GRAM' })],
    );

    expect(result.status).toBe('POSSIBLE_MATCH');
    expect(result.possibleMatches).toEqual([
      { ingredientId: 'rice', name: 'Rice', quantity: 500, unit: 'GRAM' },
    ]);
  });

  it('lists every candidate pantry row when more than one name loosely matches', () => {
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'rice-line', name: 'Rice', quantity: 200, unit: 'GRAM' })],
      [
        pantryItem({ ingredientId: 'jasmine-rice', name: 'Jasmine Rice', quantity: 300 }),
        pantryItem({ ingredientId: 'brown-rice', name: 'Brown Rice', quantity: 150 }),
        pantryItem({ ingredientId: 'salt', name: 'Salt', quantity: 50 }),
      ],
    );

    expect(result.status).toBe('POSSIBLE_MATCH');
    expect(result.possibleMatches).toHaveLength(2);
    expect(result.possibleMatches?.map(match => match.name)).toEqual([
      'Jasmine Rice',
      'Brown Rice',
    ]);
  });

  it('does not treat a shared substring as a match when it is not a whole word', () => {
    // "egg" is a substring of "eggplant" but they are different ingredients — the
    // heuristic compares whole words, not raw substrings, to avoid this false positive.
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'egg', name: 'Egg' })],
      [pantryItem({ ingredientId: 'eggplant', name: 'Eggplant' })],
    );

    expect(result.status).toBe('MISSING');
  });
});

describe('applyPossibleMatchSelection', () => {
  it('re-evaluates the row against the chosen candidate, converting units', () => {
    const [item] = getIngredientAvailability(
      [
        recipeIngredient({
          ingredientId: 'white-rice',
          name: 'White Rice',
          quantity: 500,
          unit: 'GRAM',
        }),
      ],
      [pantryItem({ ingredientId: 'rice', name: 'Rice', quantity: 1, unit: 'KILOGRAM' })],
    );
    expect(item.status).toBe('POSSIBLE_MATCH');

    const resolved = applyPossibleMatchSelection(item, item.possibleMatches![0]);

    expect(resolved.status).toBe('AVAILABLE');
    expect(resolved.pantryQuantity).toBe(1);
    expect(resolved.pantryUnit).toBe('KILOGRAM');
  });

  it('resolves to INSUFFICIENT when the chosen candidate does not have enough', () => {
    const [item] = getIngredientAvailability(
      [
        recipeIngredient({
          ingredientId: 'white-rice',
          name: 'White Rice',
          quantity: 500,
          unit: 'GRAM',
        }),
      ],
      [pantryItem({ ingredientId: 'rice', name: 'Rice', quantity: 100, unit: 'GRAM' })],
    );

    const resolved = applyPossibleMatchSelection(item, item.possibleMatches![0]);

    expect(resolved.status).toBe('INSUFFICIENT');
  });
});

describe('suggestedShoppingQuantity', () => {
  it('suggests only the shortfall when INSUFFICIENT', () => {
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'rice', quantity: 200, unit: 'GRAM' })],
      [pantryItem({ ingredientId: 'rice', quantity: 50, unit: 'GRAM' })],
    );

    expect(suggestedShoppingQuantity(result)).toBe(150);
  });

  it('converts the shortfall into the recipe unit when the pantry row uses a different one', () => {
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'rice', quantity: 2, unit: 'KILOGRAM' })],
      [pantryItem({ ingredientId: 'rice', quantity: 500, unit: 'GRAM' })],
    );

    expect(suggestedShoppingQuantity(result)).toBe(1.5);
  });

  it('suggests the full required quantity when MISSING', () => {
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'saffron', quantity: 3, unit: 'GRAM' })],
      [],
    );

    expect(suggestedShoppingQuantity(result)).toBe(3);
  });

  it('suggests the full required quantity for a POSSIBLE_MATCH', () => {
    const [result] = getIngredientAvailability(
      [recipeIngredient({ ingredientId: 'white-rice', name: 'White Rice', quantity: 4 })],
      [pantryItem({ ingredientId: 'rice', name: 'Rice', quantity: 1 })],
    );

    expect(suggestedShoppingQuantity(result)).toBe(4);
  });
});
