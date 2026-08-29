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
