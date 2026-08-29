import { describe, expect, it } from 'vitest';

import { findAllergenMatches, findDietViolations } from '@/utils/dietarySafety';

describe('findAllergenMatches', () => {
  it('flags an ingredient containing an allergy keyword', () => {
    expect(findAllergenMatches(['whole milk', 'rice'], ['Dairy'])).toEqual(['whole milk (Dairy)']);
  });

  it('matches case-insensitively', () => {
    expect(findAllergenMatches(['PEANUT Butter'], ['Peanuts'])).toEqual([
      'PEANUT Butter (Peanuts)',
    ]);
  });

  it('matches a keyword as a substring, not just a whole word', () => {
    // "anchov" is a deliberate substring for anchovy/anchovies/anchovy paste.
    expect(findAllergenMatches(['anchovy paste'], ['Fish'])).toEqual(['anchovy paste (Fish)']);
  });

  it('checks every allergy in the list, not just the first', () => {
    const result = findAllergenMatches(['shrimp', 'peanut oil'], ['Shellfish', 'Peanuts']);
    expect(result).toContain('shrimp (Shellfish)');
    expect(result).toContain('peanut oil (Peanuts)');
    expect(result).toHaveLength(2);
  });

  it('dedupes when the same allergy appears twice in the input list', () => {
    expect(findAllergenMatches(['peanut butter'], ['Peanuts', 'Peanuts'])).toEqual([
      'peanut butter (Peanuts)',
    ]);
  });

  it('does not flag an unrelated ingredient against an unrelated allergy', () => {
    expect(findAllergenMatches(['almond milk'], ['Peanuts'])).toEqual([]);
  });

  it('returns nothing for a clean ingredient list against several allergies', () => {
    expect(
      findAllergenMatches(['rice', 'olive oil', 'basil'], ['Dairy', 'Peanuts', 'Fish']),
    ).toEqual([]);
  });

  it('ignores an allergy name with no keyword mapping instead of throwing', () => {
    expect(findAllergenMatches(['milk'], ['Some Unmapped Allergy'])).toEqual([]);
  });

  it('returns nothing when either input list is empty', () => {
    expect(findAllergenMatches([], ['Dairy'])).toEqual([]);
    expect(findAllergenMatches(['milk'], [])).toEqual([]);
  });
});

describe('findDietViolations', () => {
  const beefStew = [
    { name: 'beef chuck', category: 'MEAT' as const },
    { name: 'carrot', category: 'VEGETABLE' as const },
  ];

  it('VEGETARIAN flags MEAT and FISH categories', () => {
    const withFish = [...beefStew, { name: 'salmon', category: 'FISH' as const }];
    const violations = findDietViolations(withFish, 'VEGETARIAN');
    expect(violations).toContain('beef chuck');
    expect(violations).toContain('salmon');
    expect(violations).not.toContain('carrot');
  });

  it('PESCATARIAN flags MEAT but allows FISH', () => {
    const withFish = [...beefStew, { name: 'salmon', category: 'FISH' as const }];
    const violations = findDietViolations(withFish, 'PESCATARIAN');
    expect(violations).toContain('beef chuck');
    expect(violations).not.toContain('salmon');
  });

  it('VEGAN flags MEAT, FISH, and DAIRY', () => {
    const withDairy = [...beefStew, { name: 'cheddar', category: 'DAIRY' as const }];
    const violations = findDietViolations(withDairy, 'VEGAN');
    expect(violations).toContain('beef chuck');
    expect(violations).toContain('cheddar');
  });

  it('GLUTEN_FREE flags a wheat-keyword ingredient even from a non-wheat category', () => {
    // Routed through findAllergenMatches against ['Wheat'], so the result is tagged
    // "name (Wheat)" — a different shape from the category-based diets above, which
    // return plain ingredient names. This is existing, intentional behavior (the tag
    // documents *why* it was flagged); this test pins it so a future change is a
    // deliberate decision, not an accidental format drift.
    const violations = findDietViolations(
      [{ name: 'wheat flour', category: 'GRAIN' }],
      'GLUTEN_FREE',
    );
    expect(violations).toEqual(['wheat flour (Wheat)']);
  });

  it('GLUTEN_FREE does not flag a non-wheat grain', () => {
    expect(findDietViolations([{ name: 'rice', category: 'GRAIN' }], 'GLUTEN_FREE')).toEqual([]);
  });

  it.each(['KETO', 'PALEO', 'LOW_CARB', 'OMNIVORE'] as const)(
    '%s has no structural check — always returns empty',
    dietType => {
      expect(findDietViolations(beefStew, dietType)).toEqual([]);
    },
  );

  it('returns nothing for a diet-compliant ingredient list', () => {
    const veggieBowl = [
      { name: 'tofu', category: 'LEGUME' as const },
      { name: 'broccoli', category: 'VEGETABLE' as const },
    ];
    expect(findDietViolations(veggieBowl, 'VEGAN')).toEqual([]);
  });

  it('returns nothing for an empty ingredient list', () => {
    expect(findDietViolations([], 'VEGAN')).toEqual([]);
  });
});
