import type { UnitType } from '@prisma/client';

import { CARD_GRADIENTS } from '@/constants/recipe';
import type { PantryItemDTO } from '@/types/pantry';
import type {
  PossiblePantryMatch,
  RecipeIngredientAvailability,
  RecipeIngredientDTO,
} from '@/types/recipes';
import { convertUnit } from '@/utils/unit';

export function cardGradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}

function normalizeToWords(name: string): string[] {
  return name
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Loose fallback for when a recipe ingredient has no exact pantry match by `ingredientId`
 * — e.g. an AI-generated recipe calling for "white rice" when the pantry only holds a
 * plain "Rice" entry. Those resolve to two *different* `Ingredient` rows: recipe
 * ingredients are only deduped against the catalog by exact case-insensitive name (see
 * `server/recipes/mutations.ts`'s `createRecipe`), so a qualifier like "white" is enough
 * to miss an id match entirely even though a person would recognize them as the same
 * thing. Two names are considered a "possible" match when they share at least one whole
 * word — cheap, no fuzzy-matching library, and deliberately over-inclusive since this is
 * only ever surfaced as a hint for the user to judge, never treated as a real match.
 * Returns every candidate (not just the first) — the pantry can hold more than one row
 * that plausibly matches (e.g. "jasmine rice" and "brown rice" both for a "rice" line).
 */
function findPossiblePantryMatches(
  ingredientName: string,
  pantryItems: PantryItemDTO[],
): PantryItemDTO[] {
  const words = new Set(normalizeToWords(ingredientName));
  return pantryItems.filter(item => normalizeToWords(item.name).some(word => words.has(word)));
}

/**
 * Compares what's on hand (in its own unit) against what a recipe line needs, converting
 * across units first when possible (see `convertUnit`). When the two units are from
 * different families (e.g. pantry logs "500 g" but the recipe needs "2 pieces"), there's
 * no way to compare them, so this assumes AVAILABLE rather than guessing wrong.
 */
function compareToStock(
  requiredQuantity: number,
  requiredUnit: UnitType,
  stockQuantity: number,
  stockUnit: UnitType,
): 'AVAILABLE' | 'INSUFFICIENT' {
  const convertedQuantity = convertUnit(stockQuantity, stockUnit, requiredUnit);
  if (convertedQuantity === null) return 'AVAILABLE';
  return convertedQuantity >= requiredQuantity ? 'AVAILABLE' : 'INSUFFICIENT';
}

/**
 * Matches a recipe's ingredient lines against the user's pantry, first by exact
 * `ingredientId`, then by loose name overlap (see `findPossiblePantryMatches`) for
 * anything that doesn't. Quantities are compared via `compareToStock`, converting across
 * units (grams <-> kilograms, tablespoons <-> liters, etc.) whenever the two units share
 * a family.
 */
export function getIngredientAvailability(
  ingredients: RecipeIngredientDTO[],
  pantryItems: PantryItemDTO[],
): RecipeIngredientAvailability[] {
  const pantryByIngredientId = new Map(pantryItems.map(item => [item.ingredientId, item]));

  return ingredients.map(ingredient => {
    const pantryItem = pantryByIngredientId.get(ingredient.ingredientId);

    if (!pantryItem) {
      const possibleMatches = findPossiblePantryMatches(ingredient.name, pantryItems);

      return {
        ingredientId: ingredient.ingredientId,
        name: ingredient.name,
        requiredQuantity: ingredient.quantity,
        unit: ingredient.unit,
        pantryQuantity: 0,
        pantryUnit: null,
        status: possibleMatches.length > 0 ? 'POSSIBLE_MATCH' : 'MISSING',
        possibleMatches:
          possibleMatches.length > 0
            ? possibleMatches.map(match => ({
                ingredientId: match.ingredientId,
                name: match.name,
                quantity: match.quantity,
                unit: match.unit,
              }))
            : undefined,
      };
    }

    return {
      ingredientId: ingredient.ingredientId,
      name: ingredient.name,
      requiredQuantity: ingredient.quantity,
      unit: ingredient.unit,
      pantryQuantity: pantryItem.quantity,
      pantryUnit: pantryItem.unit,
      status: compareToStock(
        ingredient.quantity,
        ingredient.unit,
        pantryItem.quantity,
        pantryItem.unit,
      ),
    };
  });
}

/**
 * Re-evaluates a `POSSIBLE_MATCH` row once the user picks which pantry item they actually
 * mean (see `PossibleMatchesButton`) — swaps in that candidate's quantity/unit and
 * recomputes AVAILABLE/INSUFFICIENT against it, same as a real `ingredientId` match would.
 */
export function applyPossibleMatchSelection(
  item: RecipeIngredientAvailability,
  candidate: PossiblePantryMatch,
): RecipeIngredientAvailability {
  return {
    ...item,
    pantryQuantity: candidate.quantity,
    pantryUnit: candidate.unit,
    status: compareToStock(item.requiredQuantity, item.unit, candidate.quantity, candidate.unit),
  };
}

/**
 * How much of an ingredient to suggest shopping for — the shortfall (converted into the
 * recipe's unit) when there's pantry stock to subtract from, otherwise the full recipe
 * requirement.
 */
export function suggestedShoppingQuantity(item: RecipeIngredientAvailability): number {
  if (item.status === 'INSUFFICIENT') {
    const stockInRecipeUnit = item.pantryUnit
      ? (convertUnit(item.pantryQuantity, item.pantryUnit, item.unit) ?? item.pantryQuantity)
      : 0;
    return Math.max(item.requiredQuantity - stockInRecipeUnit, 0);
  }
  return item.requiredQuantity;
}
