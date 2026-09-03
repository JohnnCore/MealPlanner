/**
 * Freshness is a derived placeholder metric, not real per-food shelf-life data —
 * see `utils/pantry.ts`'s `calculateFreshnessPercent` for the formula.
 */
export const SHELF_LIFE_WINDOW_DAYS = 14;

export const FRESHNESS_LOW_THRESHOLD = 25;
export const FRESHNESS_MEDIUM_THRESHOLD = 60;
