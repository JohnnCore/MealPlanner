import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config', () => ({ GEMINI_API_KEY: 'test-api-key' }));

vi.mock('@/services/ai', async () => {
  const actual = await vi.importActual('@/services/ai');
  return { ...actual, generateRecipeFromPrompt: vi.fn() };
});
vi.mock('@/server/profile/queries', () => ({ getUserDietaryProfile: vi.fn() }));
vi.mock('@/server/recipes/mutations', () => ({ createRecipe: vi.fn() }));
vi.mock('@/server/recipes/queries', () => ({ toRecipeDTO: vi.fn() }));
vi.mock('@/server/ai/mutations', () => ({ createAIGeneration: vi.fn() }));

import { createAIGeneration } from '@/server/ai/mutations';
import { getUserDietaryProfile } from '@/server/profile/queries';
import { createRecipe } from '@/server/recipes/mutations';
import { toRecipeDTO } from '@/server/recipes/queries';
import { generateRecipeFromPrompt } from '@/services/ai';
import { generateAndSaveRecipe } from '@/services/recipeGenerator';
import type { GeneratedRecipe, RecipeDTO } from '@/types/recipes';

const mockGetUserDietaryProfile = vi.mocked(getUserDietaryProfile);
const mockGenerateRecipeFromPrompt = vi.mocked(generateRecipeFromPrompt);
const mockCreateRecipe = vi.mocked(createRecipe);
const mockToRecipeDTO = vi.mocked(toRecipeDTO);
const mockCreateAIGeneration = vi.mocked(createAIGeneration);

function makeRecipe(overrides: Partial<GeneratedRecipe> = {}): GeneratedRecipe {
  return {
    title: 'Test Recipe',
    description: 'A recipe for testing.',
    servings: 999, // deliberately wrong — the caller must never trust this
    cookTimeMinutes: 20,
    difficulty: 'EASY',
    ingredients: [{ name: 'rice', quantity: 200, unit: 'GRAM', category: 'GRAIN' }],
    instructions: ['Cook the rice.'],
    ...overrides,
  };
}

function mockGeminiResult(recipe: GeneratedRecipe, tokensUsed: number | null = 100) {
  // `raw` is opaque to recipeGenerator.ts — it's only ever forwarded to
  // createAIGeneration's audit log, never read — so an empty object stands in fine.
  return { recipe, raw: {}, tokensUsed };
}

const OMNIVORE_PROFILE = { dietType: 'OMNIVORE' as const, defaultServings: 2, allergyNames: [] };
const SAVED_RECIPE = { id: 'saved-recipe-id' };
const FINAL_DTO = { id: 'saved-recipe-id', title: 'Test Recipe' } as unknown as RecipeDTO;

beforeEach(() => {
  // @ts-expect-error -- partial Prisma row is enough for these tests
  mockCreateRecipe.mockResolvedValue(SAVED_RECIPE);
  mockToRecipeDTO.mockReturnValue(FINAL_DTO);
  mockCreateAIGeneration.mockResolvedValue(undefined as never);
});

describe('generateAndSaveRecipe', () => {
  it('throws without calling anything else when the profile does not exist', async () => {
    mockGetUserDietaryProfile.mockResolvedValue(null);

    await expect(generateAndSaveRecipe('missing-user', 'anything')).rejects.toThrow(
      /User not found/,
    );

    expect(mockGenerateRecipeFromPrompt).not.toHaveBeenCalled();
    expect(mockCreateRecipe).not.toHaveBeenCalled();
  });

  describe('servings', () => {
    it('defaults to the profile servings when no override is given', async () => {
      mockGetUserDietaryProfile.mockResolvedValue({ ...OMNIVORE_PROFILE, defaultServings: 3 });
      mockGenerateRecipeFromPrompt.mockResolvedValue(mockGeminiResult(makeRecipe()));

      await generateAndSaveRecipe('user-1', 'a soup');

      expect(mockCreateRecipe).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ servings: 3 }),
      );
    });

    it('uses the requested override instead of the profile default', async () => {
      mockGetUserDietaryProfile.mockResolvedValue({ ...OMNIVORE_PROFILE, defaultServings: 3 });
      mockGenerateRecipeFromPrompt.mockResolvedValue(mockGeminiResult(makeRecipe()));

      await generateAndSaveRecipe('user-1', 'a soup', 6);

      expect(mockCreateRecipe).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ servings: 6 }),
      );
    });

    it('never trusts the model-reported servings field', async () => {
      mockGetUserDietaryProfile.mockResolvedValue(OMNIVORE_PROFILE);
      // makeRecipe() defaults servings to 999 — createRecipe must not see that value.
      mockGenerateRecipeFromPrompt.mockResolvedValue(mockGeminiResult(makeRecipe()));

      await generateAndSaveRecipe('user-1', 'a soup');

      const [, input] = mockCreateRecipe.mock.calls[0];
      expect(input.servings).not.toBe(999);
      expect(input.servings).toBe(OMNIVORE_PROFILE.defaultServings);
    });
  });

  it('passes the profile diet and allergies through as generation constraints', async () => {
    mockGetUserDietaryProfile.mockResolvedValue({
      dietType: 'VEGAN',
      defaultServings: 2,
      allergyNames: ['Peanuts'],
    });
    mockGenerateRecipeFromPrompt.mockResolvedValue(
      mockGeminiResult(
        makeRecipe({
          ingredients: [{ name: 'rice', quantity: 1, unit: 'UNIT', category: 'GRAIN' }],
        }),
      ),
    );

    await generateAndSaveRecipe('user-1', 'a soup');

    expect(mockGenerateRecipeFromPrompt).toHaveBeenCalledWith('a soup', {
      servings: 2,
      dietType: 'VEGAN',
      allergyNames: ['Peanuts'],
    });
  });

  describe('clean first attempt', () => {
    beforeEach(() => {
      mockGetUserDietaryProfile.mockResolvedValue(OMNIVORE_PROFILE);
      mockGenerateRecipeFromPrompt.mockResolvedValue(mockGeminiResult(makeRecipe(), 250));
    });

    it('generates exactly once and returns the persisted DTO', async () => {
      const result = await generateAndSaveRecipe('user-1', 'a soup');

      expect(mockGenerateRecipeFromPrompt).toHaveBeenCalledTimes(1);
      expect(result).toBe(FINAL_DTO);
    });

    it('logs the call to AIGeneration with the prompt, constraints, and token count', async () => {
      await generateAndSaveRecipe('user-1', 'a soup');

      expect(mockCreateAIGeneration).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          type: 'RECIPE',
          prompt: { prompt: 'a soup', constraints: expect.objectContaining({ servings: 2 }) },
          tokensUsed: 250,
        }),
      );
    });

    it('still resolves successfully even if the audit log write fails', async () => {
      mockCreateAIGeneration.mockRejectedValue(new Error('db is down'));

      await expect(generateAndSaveRecipe('user-1', 'a soup')).resolves.toBe(FINAL_DTO);
    });
  });

  describe('allergy/diet violation retry', () => {
    beforeEach(() => {
      mockGetUserDietaryProfile.mockResolvedValue({
        dietType: 'OMNIVORE',
        defaultServings: 2,
        allergyNames: ['Peanuts'],
      });
    });

    it('retries once with a correction hint, then saves the clean second attempt', async () => {
      const flaggedRecipe = makeRecipe({
        ingredients: [
          { name: 'peanut butter', quantity: 1, unit: 'TABLESPOON', category: 'OTHER' },
        ],
      });
      const cleanRecipe = makeRecipe({
        title: 'Corrected Recipe',
        ingredients: [
          { name: 'almond butter', quantity: 1, unit: 'TABLESPOON', category: 'OTHER' },
        ],
      });

      mockGenerateRecipeFromPrompt
        .mockResolvedValueOnce(mockGeminiResult(flaggedRecipe))
        .mockResolvedValueOnce(mockGeminiResult(cleanRecipe));

      await generateAndSaveRecipe('user-1', 'a peanut sauce');

      expect(mockGenerateRecipeFromPrompt).toHaveBeenCalledTimes(2);

      // Second call carries a retry hint naming what was wrong.
      const secondCallArgs = mockGenerateRecipeFromPrompt.mock.calls[1];
      expect(secondCallArgs[2]).toEqual(expect.stringContaining('peanut butter (Peanuts)'));

      // The corrected recipe is what actually gets saved.
      expect(mockCreateRecipe).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ title: 'Corrected Recipe' }),
      );
    });

    it('also retries on a diet violation, not just an allergy match', async () => {
      mockGetUserDietaryProfile.mockResolvedValue({
        dietType: 'VEGETARIAN',
        defaultServings: 2,
        allergyNames: [],
      });
      const meatyRecipe = makeRecipe({
        ingredients: [{ name: 'beef chuck', quantity: 1, unit: 'PIECE', category: 'MEAT' }],
      });
      const cleanRecipe = makeRecipe({
        ingredients: [{ name: 'tofu', quantity: 1, unit: 'PIECE', category: 'LEGUME' }],
      });

      mockGenerateRecipeFromPrompt
        .mockResolvedValueOnce(mockGeminiResult(meatyRecipe))
        .mockResolvedValueOnce(mockGeminiResult(cleanRecipe));

      await generateAndSaveRecipe('user-1', 'a stew');

      expect(mockGenerateRecipeFromPrompt).toHaveBeenCalledTimes(2);
      expect(mockCreateRecipe).toHaveBeenCalled();
    });

    it('fails safe — never saves — when the retry is still flagged', async () => {
      const flaggedRecipe = makeRecipe({
        ingredients: [{ name: 'peanut oil', quantity: 1, unit: 'TABLESPOON', category: 'OIL' }],
      });

      mockGenerateRecipeFromPrompt.mockResolvedValue(mockGeminiResult(flaggedRecipe));

      await expect(generateAndSaveRecipe('user-1', 'a stir fry')).rejects.toThrow(
        /diet and allergies/,
      );

      expect(mockGenerateRecipeFromPrompt).toHaveBeenCalledTimes(2);
      expect(mockCreateRecipe).not.toHaveBeenCalled();
      expect(mockCreateAIGeneration).not.toHaveBeenCalled();
    });
  });
});
