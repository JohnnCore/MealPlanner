import type { UnitType } from '@prisma/client';

/**
 * `UnitType` display config — shared by every domain that stores a quantity/unit pair
 * (shopping list items, pantry items, recipe ingredients).
 */
export const UNIT_OPTIONS = [
  { value: 'PIECE', label: 'pcs' },
  { value: 'UNIT', label: 'unit' },
  { value: 'GRAM', label: 'g' },
  { value: 'KILOGRAM', label: 'kg' },
  { value: 'MILLILITER', label: 'ml' },
  { value: 'LITER', label: 'L' },
  { value: 'TABLESPOON', label: 'tbsp' },
  { value: 'TEASPOON', label: 'tsp' },
] as const;

export const UNIT_DISPLAY: Record<string, string> = Object.fromEntries(
  UNIT_OPTIONS.map(u => [u.value, u.label]),
);

/**
 * Which physical quantity a unit measures — only units in the same family can be
 * converted into one another (see `utils/unit.ts`'s `convertUnit`). Mass and volume are
 * never cross-converted since that depends on an ingredient's density, which this app
 * doesn't track; `UNIT` and `PIECE` are both plain counts and freely interchangeable.
 */
export type UnitFamily = 'MASS' | 'VOLUME' | 'COUNT';

export const UNIT_FAMILY: Record<UnitType, UnitFamily> = {
  GRAM: 'MASS',
  KILOGRAM: 'MASS',
  MILLILITER: 'VOLUME',
  LITER: 'VOLUME',
  TABLESPOON: 'VOLUME',
  TEASPOON: 'VOLUME',
  UNIT: 'COUNT',
  PIECE: 'COUNT',
};

/**
 * Multiplier to convert one of this unit into its family's base unit (gram, milliliter,
 * or a single count). Tablespoon/teaspoon use the standard US culinary approximation
 * (1 tbsp = 15 mL = 3 tsp) — close enough for pantry bookkeeping, not lab-precise.
 */
export const UNIT_TO_BASE_FACTOR: Record<UnitType, number> = {
  GRAM: 1,
  KILOGRAM: 1000,
  MILLILITER: 1,
  LITER: 1000,
  TABLESPOON: 15,
  TEASPOON: 5,
  UNIT: 1,
  PIECE: 1,
};
