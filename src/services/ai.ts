import type { DietType } from '@prisma/client';
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
  'You are a recipe generator for a meal-planning app. Given a structured request, invent ' +
  'one complete, realistic recipe that satisfies it. Always use practical home-cook ' +
  'quantities scaled to the required servings. Each `instructions` array entry is one ' +
  'already-numbered step in the UI — write it as a plain imperative sentence with no ' +
  'leading number or "Step" prefix. Diet and allergy constraints are hard requirements, ' +
  'not preferences: never include an excluded ingredient, and do not suggest a ' +
  'substitution that still contains it.';

/** Natural-language diet phrasing for the prompt. OMNIVORE has none — it's the absence of a rule. */
const DIET_PROMPT_PHRASES: Partial<Record<DietType, string>> = {
  VEGETARIAN: 'vegetarian (no meat or fish; dairy and eggs are fine)',
  VEGAN: 'vegan (no meat, fish, dairy, eggs, or any animal-derived ingredient)',
  PESCATARIAN: 'pescatarian (no meat; fish and seafood are fine)',
  KETO: 'ketogenic (very low-carb, high-fat — avoid grains, sugar, and starchy vegetables)',
  PALEO: 'paleo (no grains, legumes, dairy, or refined sugar)',
  GLUTEN_FREE: 'gluten-free (no wheat, barley, rye, or other gluten-containing ingredients)',
  LOW_CARB: 'low-carb (minimize grains, sugar, and starchy vegetables)',
};

interface RecipeGenerationConstraints {
  servings: number;
  dietType: DietType;
  allergyNames: string[];
}

/**
 * Every generation call is wrapped in this same field order — free-text request, then
 * servings, then diet, then allergies — regardless of what the user typed or which
 * constraints are empty. Keeping one canonical template (rather than ad hoc string
 * concatenation per call site) is what makes the model's input consistent across requests.
 */
function buildPromptText(
  userPrompt: string,
  constraints: RecipeGenerationConstraints,
  retryHint?: string,
): string {
  const lines = [`Request: ${userPrompt}`, `Servings required: exactly ${constraints.servings}.`];

  const dietPhrase = DIET_PROMPT_PHRASES[constraints.dietType];
  if (dietPhrase) lines.push(`Diet: strictly ${dietPhrase}.`);

  if (constraints.allergyNames.length > 0) {
    lines.push(
      `Allergies — the user cannot eat: ${constraints.allergyNames.join(', ')}. Do not use ` +
        'any ingredient containing or derived from these.',
    );
  }

  if (retryHint) lines.push(`Correction: ${retryHint}`);

  return lines.join('\n');
}

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
 * Calls Gemini's structured-output mode to turn a free-text prompt plus the user's
 * dietary constraints into a recipe. `retryHint` is set by recipeGenerator.ts when a
 * first attempt fails the post-generation allergy/diet check, asking for a correction
 * without restarting the whole request.
 *
 * Returns the parsed recipe alongside the raw response (logged to AIGeneration for audit)
 * and the token count Gemini reports.
 */
export async function generateRecipeFromPrompt(
  userPrompt: string,
  constraints: RecipeGenerationConstraints,
  retryHint?: string,
): Promise<{
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
      contents: [
        { role: 'user', parts: [{ text: buildPromptText(userPrompt, constraints, retryHint) }] },
      ],
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
