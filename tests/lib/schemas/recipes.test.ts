import { describe, expect, it } from 'vitest';

import { generateRecipeSchema } from '@/lib/schemas/recipes';

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
