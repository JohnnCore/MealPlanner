import { describe, expect, it } from 'vitest';

import { convertUnit } from '@/utils/unit';

describe('convertUnit', () => {
  it('returns the same quantity when the units already match', () => {
    expect(convertUnit(200, 'GRAM', 'GRAM')).toBe(200);
  });

  it('converts within the mass family', () => {
    expect(convertUnit(1.5, 'KILOGRAM', 'GRAM')).toBe(1500);
    expect(convertUnit(500, 'GRAM', 'KILOGRAM')).toBe(0.5);
  });

  it('converts within the volume family, including tablespoons/teaspoons', () => {
    expect(convertUnit(1, 'LITER', 'MILLILITER')).toBe(1000);
    expect(convertUnit(1, 'TABLESPOON', 'MILLILITER')).toBe(15);
    expect(convertUnit(3, 'TEASPOON', 'TABLESPOON')).toBe(1);
  });

  it('treats UNIT and PIECE as the same count', () => {
    expect(convertUnit(4, 'PIECE', 'UNIT')).toBe(4);
  });

  it('returns null across families that cannot be compared', () => {
    expect(convertUnit(500, 'GRAM', 'PIECE')).toBeNull();
    expect(convertUnit(1, 'LITER', 'KILOGRAM')).toBeNull();
  });
});
