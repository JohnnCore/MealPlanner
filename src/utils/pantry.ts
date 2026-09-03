import {
  FRESHNESS_LOW_THRESHOLD,
  FRESHNESS_MEDIUM_THRESHOLD,
  SHELF_LIFE_WINDOW_DAYS,
} from '@/constants/pantry';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Placeholder freshness metric: a flat linear decay over a fixed shelf-life window,
 * independent of ingredient/category. There's no real per-food shelf-life data source
 * to drive this, so it's deliberately simple rather than scientific.
 * Returns `null` when there's no expiry date — "unknown" is not the same as "fresh".
 */
export function calculateFreshnessPercent(
  expiresAt: Date | null,
  now: Date = new Date(),
): number | null {
  if (!expiresAt) return null;

  const daysRemaining = (expiresAt.getTime() - now.getTime()) / MS_PER_DAY;
  const percent = (daysRemaining / SHELF_LIFE_WINDOW_DAYS) * 100;

  return Math.round(Math.min(100, Math.max(0, percent)));
}

/**
 * Explicit green/orange/red rather than the `primary`/`secondary` theme tokens — this
 * app's `--primary` is a neutral gray (see globals.css), so a status color needs to be
 * hardcoded. Matches the same convention already used by the shopping list's progress
 * bar (`bg-green-500`/`bg-orange-400`).
 */
export function freshnessColorClass(percent: number | null): string {
  if (percent === null) return 'bg-muted-foreground/40';
  if (percent < FRESHNESS_LOW_THRESHOLD) return 'bg-destructive';
  if (percent < FRESHNESS_MEDIUM_THRESHOLD) return 'bg-orange-400';
  return 'bg-green-500';
}

export function freshnessLabel(percent: number | null): string {
  if (percent === null) return 'No expiry set';
  if (percent < FRESHNESS_LOW_THRESHOLD) return 'Expiring soon';
  if (percent < FRESHNESS_MEDIUM_THRESHOLD) return 'Use soon';
  return 'Fresh';
}
