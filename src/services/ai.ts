import { IngredientCategory, UnitType } from '@prisma/client';

import { GEMINI_API_KEY } from '@/lib/config';
import type { GeneratedRecipe } from '@/types/recipes';

// "-lite" for latency: the non-lite flash tier on this key defaults to extended
// thinking mode (~110s for a single recipe) with no way to disable it via
// thinkingConfig.thinkingBudget. The lite tier returns the same schema in ~2s.
const GEMINI_MODEL = 'gemini-flash-lite-latest';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Derived from the Prisma enums (not hand-copied) so the schema we hand Gemini can never
// drift from what the database actually accepts.
const UNIT_VALUES = Object.values(UnitType);
const INGREDIENT_CATEGORY_VALUES = Object.values(IngredientCategory);

/** Constrains Gemini's output to a shape that maps 1:1 onto our Recipe + RecipeIngredient tables. */
const RECIPE_RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    description: { type: 'STRING' },
    servings: { type: 'INTEGER' },
    cookTimeMinutes: { type: 'INTEGER' },
    difficulty: { type: 'STRING', enum: ['EASY', 'MEDIUM', 'HARD'] },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          quantity: { type: 'NUMBER' },
          unit: { type: 'STRING', enum: UNIT_VALUES },
          category: { type: 'STRING', enum: INGREDIENT_CATEGORY_VALUES },
        },
        required: ['name', 'quantity', 'unit', 'category'],
      },
    },
    instructions: { type: 'ARRAY', items: { type: 'STRING' } },
  },
  required: [
    'title',
    'description',
    'servings',
    'cookTimeMinutes',
    'difficulty',
    'ingredients',
    'instructions',
  ],
};

const SYSTEM_INSTRUCTION =
  'You are a recipe generator for a meal-planning app. Given a short request from the user, ' +
  'invent one complete, realistic recipe that satisfies it. Always use practical home-cook ' +
  'quantities. Each `instructions` array entry is one already-numbered step in the UI — write ' +
  'it as a plain imperative sentence with no leading number or "Step" prefix.';

/** Expected, user-facing failure — the calling action surfaces `message` verbatim. */
export class AIGenerationError extends Error {}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  usageMetadata?: { totalTokenCount?: number };
  promptFeedback?: { blockReason?: string };
}

/**
 * Calls Gemini's structured-output mode to turn a free-text prompt into a recipe.
 * Returns the parsed recipe alongside the raw response (logged to AIGeneration for audit)
 * and the token count Gemini reports.
 */
export async function generateRecipeFromPrompt(prompt: string): Promise<{
  recipe: GeneratedRecipe;
  raw: GeminiResponse;
  tokensUsed: number | null;
}> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RECIPE_RESPONSE_SCHEMA,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new AIGenerationError(
      res.status === 429
        ? 'The recipe generator is busy right now — try again in a moment.'
        : `Recipe generation failed (${res.status}). ${body.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as GeminiResponse;

  if (json.promptFeedback?.blockReason) {
    throw new AIGenerationError('That request was blocked — try rephrasing it.');
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new AIGenerationError('The recipe generator returned an empty response.');
  }

  let recipe: GeneratedRecipe;
  try {
    recipe = JSON.parse(text) as GeneratedRecipe;
  } catch {
    throw new AIGenerationError('The recipe generator returned an unreadable response.');
  }

  return {
    recipe,
    raw: json,
    tokensUsed: json.usageMetadata?.totalTokenCount ?? null,
  };
}
