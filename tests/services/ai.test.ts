import type { Mock } from 'vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config', () => ({ GEMINI_API_KEY: 'test-api-key' }));

import { AIGenerationError, generateRecipeFromPrompt } from '@/services/ai';

const OMNIVORE_NO_ALLERGIES = { servings: 2, dietType: 'OMNIVORE' as const, allergyNames: [] };

const VALID_RECIPE = {
  title: 'Test Recipe',
  description: 'A recipe for testing.',
  servings: 2,
  cookTimeMinutes: 20,
  difficulty: 'EASY',
  ingredients: [{ name: 'rice', quantity: 200, unit: 'GRAM', category: 'GRAIN' }],
  instructions: ['Cook the rice.'],
};

function mockFetchOnce(body: unknown, init?: { ok?: boolean; status?: number }) {
  const ok = init?.ok ?? true;
  const status = init?.status ?? 200;
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
    text: vi.fn().mockResolvedValue(typeof body === 'string' ? body : JSON.stringify(body)),
  });
}

function geminiSuccessBody(recipe: unknown, tokensUsed?: number) {
  return {
    candidates: [{ content: { parts: [{ text: JSON.stringify(recipe) }] }, finishReason: 'STOP' }],
    ...(tokensUsed !== undefined ? { usageMetadata: { totalTokenCount: tokensUsed } } : {}),
  };
}

/** Pulls the text Gemini was actually sent, for asserting on prompt structure. */
function sentPromptText(fetchMock: Mock): string {
  const body = JSON.parse(fetchMock.mock.calls[0][1].body);
  return body.contents[0].parts[0].text;
}

describe('generateRecipeFromPrompt', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful response', () => {
    it('parses and returns the recipe, raw response, and token count', async () => {
      global.fetch = mockFetchOnce(geminiSuccessBody(VALID_RECIPE, 123));

      const result = await generateRecipeFromPrompt('a quick chicken pasta', OMNIVORE_NO_ALLERGIES);

      expect(result.recipe).toEqual(VALID_RECIPE);
      expect(result.tokensUsed).toBe(123);
      expect(result.raw.candidates).toBeDefined();
    });

    it('returns null tokensUsed when usageMetadata is absent', async () => {
      global.fetch = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));

      const result = await generateRecipeFromPrompt('a quick chicken pasta', OMNIVORE_NO_ALLERGIES);

      expect(result.tokensUsed).toBeNull();
    });

    it('sends the API key as a header, not a query param', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt('a quick chicken pasta', OMNIVORE_NO_ALLERGIES);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).not.toContain('test-api-key');
      expect(init.headers['x-goog-api-key']).toBe('test-api-key');
    });
  });

  describe('prompt construction', () => {
    it('always includes the request and the exact servings count', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt('a quick chicken pasta', {
        servings: 4,
        dietType: 'OMNIVORE',
        allergyNames: [],
      });

      const text = sentPromptText(fetchMock);
      expect(text).toContain('Request: a quick chicken pasta');
      expect(text).toContain('Servings required: exactly 4.');
    });

    it('omits the diet line entirely for OMNIVORE', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES);

      expect(sentPromptText(fetchMock)).not.toContain('Diet:');
    });

    it('includes a diet line for a non-OMNIVORE diet', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt('anything', {
        servings: 2,
        dietType: 'VEGAN',
        allergyNames: [],
      });

      expect(sentPromptText(fetchMock)).toMatch(/Diet: strictly vegan/);
    });

    it('omits the allergies line when there are none', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES);

      expect(sentPromptText(fetchMock)).not.toContain('Allerg');
    });

    it('includes every allergy name when present', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt('anything', {
        servings: 2,
        dietType: 'OMNIVORE',
        allergyNames: ['Peanuts', 'Shellfish'],
      });

      const text = sentPromptText(fetchMock);
      expect(text).toContain('the user cannot eat: Peanuts, Shellfish');
    });

    it('appends a correction line only when a retryHint is given', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt(
        'anything',
        OMNIVORE_NO_ALLERGIES,
        'avoid peanut butter, it was flagged',
      );

      expect(sentPromptText(fetchMock)).toContain(
        'Correction: avoid peanut butter, it was flagged',
      );
    });

    it('omits the correction line when no retryHint is given', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES);

      expect(sentPromptText(fetchMock)).not.toContain('Correction:');
    });

    it('keeps field order stable regardless of which constraints are present', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt(
        'anything',
        { servings: 3, dietType: 'VEGETARIAN', allergyNames: ['Eggs'] },
        'fix it',
      );

      const text = sentPromptText(fetchMock);
      const order = ['Request:', 'Servings required:', 'Diet:', 'Allergies', 'Correction:'];
      const positions = order.map(marker => text.indexOf(marker));
      expect(positions.every(p => p >= 0)).toBe(true);
      expect(positions).toEqual([...positions].sort((a, b) => a - b));
    });

    it('requests structured JSON output constrained by a responseSchema', async () => {
      const fetchMock = mockFetchOnce(geminiSuccessBody(VALID_RECIPE));
      global.fetch = fetchMock;

      await generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES);

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.generationConfig.responseMimeType).toBe('application/json');
      expect(body.generationConfig.responseSchema.properties.difficulty.enum).toEqual([
        'EASY',
        'MEDIUM',
        'HARD',
      ]);
    });
  });

  describe('error handling', () => {
    it('throws AIGenerationError with a friendly message on a 429', async () => {
      global.fetch = mockFetchOnce('rate limited', { ok: false, status: 429 });

      await expect(
        generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES),
      ).rejects.toMatchObject({
        constructor: AIGenerationError,
        message: expect.stringContaining('busy right now'),
      });
    });

    it('throws AIGenerationError with the status and body on other non-ok responses', async () => {
      global.fetch = mockFetchOnce('Internal Server Error', { ok: false, status: 500 });

      await expect(generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES)).rejects.toThrow(
        /Recipe generation failed \(500\)/,
      );
    });

    it('does not blow up if reading the error body itself fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: vi.fn().mockRejectedValue(new Error('stream already read')),
      });

      await expect(generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES)).rejects.toThrow(
        AIGenerationError,
      );
    });

    it('throws when the prompt was blocked', async () => {
      global.fetch = mockFetchOnce({ promptFeedback: { blockReason: 'SAFETY' } });

      await expect(generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES)).rejects.toThrow(
        /blocked/,
      );
    });

    it('throws when there are no candidates at all', async () => {
      global.fetch = mockFetchOnce({});

      await expect(generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES)).rejects.toThrow(
        /empty response/,
      );
    });

    it('throws when the candidate text is an empty string', async () => {
      global.fetch = mockFetchOnce({
        candidates: [{ content: { parts: [{ text: '' }] } }],
      });

      await expect(generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES)).rejects.toThrow(
        /empty response/,
      );
    });

    it('throws when the candidate text is not valid JSON', async () => {
      global.fetch = mockFetchOnce({
        candidates: [{ content: { parts: [{ text: 'not json{{{' }] } }],
      });

      await expect(generateRecipeFromPrompt('anything', OMNIVORE_NO_ALLERGIES)).rejects.toThrow(
        /unreadable response/,
      );
    });
  });
});
