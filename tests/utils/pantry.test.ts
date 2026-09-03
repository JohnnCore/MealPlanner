import { describe, expect, it } from 'vitest';

import { calculateFreshnessPercent, freshnessColorClass, freshnessLabel } from '@/utils/pantry';

const NOW = new Date('2026-03-01T00:00:00.000Z');

function daysFromNow(days: number): Date {
  return new Date(NOW.getTime() + days * 24 * 60 * 60 * 1000);
}

describe('calculateFreshnessPercent', () => {
  it('returns null when there is no expiry date', () => {
    expect(calculateFreshnessPercent(null, NOW)).toBeNull();
  });

  it('clamps to 0 once the expiry date is in the past', () => {
    expect(calculateFreshnessPercent(daysFromNow(-3), NOW)).toBe(0);
  });

  it('clamps to 100 when the expiry is far beyond the shelf-life window', () => {
    expect(calculateFreshnessPercent(daysFromNow(365), NOW)).toBe(100);
  });

  it('returns a mid-window value proportional to days remaining', () => {
    // Window is 14 days — 7 days remaining is exactly half.
    expect(calculateFreshnessPercent(daysFromNow(7), NOW)).toBe(50);
  });

  it('returns 100 exactly at the start of the window', () => {
    expect(calculateFreshnessPercent(daysFromNow(14), NOW)).toBe(100);
  });

  it('returns 0 exactly at expiry', () => {
    expect(calculateFreshnessPercent(NOW, NOW)).toBe(0);
  });
});

describe('freshnessColorClass', () => {
  it('returns a muted class for an unknown (null) freshness', () => {
    expect(freshnessColorClass(null)).toMatch(/muted/);
  });

  it('returns the destructive class below the low threshold', () => {
    expect(freshnessColorClass(10)).toMatch(/destructive/);
  });

  it('returns a warning class between the low and medium thresholds', () => {
    expect(freshnessColorClass(40)).toMatch(/orange/);
  });

  it('returns the green/fresh class at or above the medium threshold', () => {
    expect(freshnessColorClass(90)).toMatch(/green/);
  });
});

describe('freshnessLabel', () => {
  it('labels null as no expiry set', () => {
    expect(freshnessLabel(null)).toBe('No expiry set');
  });

  it('labels a low percentage as expiring soon', () => {
    expect(freshnessLabel(10)).toBe('Expiring soon');
  });

  it('labels a mid percentage as use soon', () => {
    expect(freshnessLabel(40)).toBe('Use soon');
  });

  it('labels a high percentage as fresh', () => {
    expect(freshnessLabel(90)).toBe('Fresh');
  });
});
