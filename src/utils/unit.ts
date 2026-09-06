import type { UnitType } from '@prisma/client';

import { UNIT_FAMILY, UNIT_TO_BASE_FACTOR } from '@/constants/unit';

/**
 * Converts a quantity between two `UnitType`s in the same family (mass, volume, or
 * count) — e.g. grams <-> kilograms, or tablespoons <-> liters. Returns `null` when the
 * two units belong to different families (e.g. grams vs. pieces) — that conversion
 * depends on the specific ingredient's density or serving size, which this app doesn't
 * track, so it's left unconverted rather than guessed at.
 */
export function convertUnit(quantity: number, from: UnitType, to: UnitType): number | null {
  if (from === to) return quantity;
  if (UNIT_FAMILY[from] !== UNIT_FAMILY[to]) return null;
  return (quantity * UNIT_TO_BASE_FACTOR[from]) / UNIT_TO_BASE_FACTOR[to];
}
