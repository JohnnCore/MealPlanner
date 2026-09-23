import { describe, expect, it } from 'vitest';

import { generateRecipeSchema, saveRecipeSchema } from '@/lib/schemas/recipes';

describe('generateRecipeSchema', () => {
  it('accepts a valid prompt with no servings override', () => {
    const result = generateRecipeSchema.safeParse({ prompt: 'a quick chicken pasta' });
    expect(result.success).toBe(true);
    expect(result.data?.servings).toBeUndefined();
  });

  it('accepts a valid prompt with a servings override', () => {
    const result = generateRecipeSchema.safeParse({ prompt: 'a quick chicken pasta', servings: 4 });
    expect(result.success).toBe(true);
    expect(result.data?.servings).toBe(4);
  });

  it('trims whitespace from the prompt', () => {
    const result = generateRecipeSchema.safeParse({ prompt: '  a quick chicken pasta  ' });
    expect(result.data?.prompt).toBe('a quick chicken pasta');
  });

  it('rejects a prompt under the minimum length', () => {
    const result = generateRecipeSchema.safeParse({ prompt: 'hi' });
    expect(result.success).toBe(false);
  });

  it('rejects a prompt that is only whitespace, since trimming happens before the length check', () => {
    const result = generateRecipeSchema.safeParse({ prompt: '     ' });
    expect(result.success).toBe(false);
  });

  it('rejects a prompt over the maximum length', () => {
    const result = generateRecipeSchema.safeParse({ prompt: 'a'.repeat(501) });
    expect(result.success).toBe(false);
  });

  it('accepts a prompt at exactly the maximum length', () => {
    const result = generateRecipeSchema.safeParse({ prompt: 'a'.repeat(500) });
    expect(result.success).toBe(true);
  });

  it('rejects a missing prompt', () => {
    const result = generateRecipeSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it.each([0, -1, 13, 1.5])(
    'rejects an out-of-range or non-integer servings value: %p',
    servings => {
      const result = generateRecipeSchema.safeParse({ prompt: 'a quick chicken pasta', servings });
      expect(result.success).toBe(false);
    },
  );

  it.each([1, 12])('accepts servings at the boundary: %p', servings => {
    const result = generateRecipeSchema.safeParse({ prompt: 'a quick chicken pasta', servings });
    expect(result.success).toBe(true);
  });

  it('rejects a non-string prompt', () => {
    const result = generateRecipeSchema.safeParse({ prompt: 123 });
    expect(result.success).toBe(false);
  });
});

describe('saveRecipeSchema', () => {
  const valid = {
    title: '  Tomato soup ',
    servings: 2,
    cookTimeMinutes: 25,
    difficulty: 'EASY',
    ingredients: [
      { ingredientId: 'abc', quantity: 400, unit: 'GRAM' },
      { name: 'Basil', category: 'SPICE', quantity: 1, unit: 'TABLESPOON' },
    ],
    instructions: ['Chop', ' Simmer '],
  };

  it('accepts a recipe mixing existing and new ingredients, trimming text', () => {
    const result = saveRecipeSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.title).toBe('Tomato soup');
    expect(result.data?.instructions).toEqual(['Chop', 'Simmer']);
  });

  it('requires at least one ingredient and one step', () => {
    expect(saveRecipeSchema.safeParse({ ...valid, ingredients: [] }).success).toBe(false);
    expect(saveRecipeSchema.safeParse({ ...valid, instructions: [] }).success).toBe(false);
  });

  it('rejects a blank step and a non-positive quantity', () => {
    expect(saveRecipeSchema.safeParse({ ...valid, instructions: ['  '] }).success).toBe(false);
    const zero = [{ ingredientId: 'abc', quantity: 0, unit: 'GRAM' }];
    expect(saveRecipeSchema.safeParse({ ...valid, ingredients: zero }).success).toBe(false);
  });

  it('rejects an ingredient line that is neither an id nor a name + category', () => {
    const line = [{ name: 'Basil', quantity: 1, unit: 'GRAM' }];
    expect(saveRecipeSchema.safeParse({ ...valid, ingredients: line }).success).toBe(false);
  });

  it('rejects an ingredient line that gives both an id and new-ingredient details', () => {
    const line = [
      { ingredientId: 'abc', name: 'Basil', category: 'SPICE', quantity: 1, unit: 'GRAM' },
    ];
    expect(saveRecipeSchema.safeParse({ ...valid, ingredients: line }).success).toBe(false);
  });
});
