import { describe, expect, it } from 'vitest';

import type { MealPlanDTO } from '@/types/mealPlan';
import {
  addDays,
  dateKeyToUtc,
  getWeekDates,
  getWeekStart,
  indexMealPlansBySlot,
  parseDateKey,
  readMealDragPayload,
  slotKey,
  toDateKey,
} from '@/utils/mealPlan';

describe('date keys', () => {
  it('round-trips a local calendar day', () => {
    expect(toDateKey(parseDateKey('2026-03-08'))).toBe('2026-03-08');
  });

  it('pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('converts a key to UTC midnight regardless of local time zone', () => {
    expect(dateKeyToUtc('2026-09-15').toISOString()).toBe('2026-09-15T00:00:00.000Z');
  });
});

describe('week helpers', () => {
  it('starts weeks on Monday', () => {
    // 2026-09-16 is a Wednesday
    expect(toDateKey(getWeekStart(parseDateKey('2026-09-16')))).toBe('2026-09-14');
  });

  it('treats Sunday as the last day of its week, not the first of the next', () => {
    expect(toDateKey(getWeekStart(parseDateKey('2026-09-20')))).toBe('2026-09-14');
  });

  it('returns Monday-Sunday, crossing month boundaries', () => {
    const keys = getWeekDates(parseDateKey('2026-09-28')).map(toDateKey);
    expect(keys).toEqual([
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ]);
  });

  it('adds days without mutating its input', () => {
    const start = parseDateKey('2026-09-14');
    addDays(start, 7);
    expect(toDateKey(start)).toBe('2026-09-14');
  });
});

describe('indexMealPlansBySlot', () => {
  it('indexes by day + meal type', () => {
    const meal = {
      id: 'm1',
      date: '2026-09-14',
      mealType: 'LUNCH',
    } as MealPlanDTO;

    const index = indexMealPlansBySlot([meal]);

    expect(index.get(slotKey('2026-09-14', 'LUNCH'))).toBe(meal);
    expect(index.get(slotKey('2026-09-14', 'DINNER'))).toBeUndefined();
  });
});

describe('readMealDragPayload', () => {
  const transfer = (raw: string) => ({ getData: () => raw }) as unknown as DataTransfer;

  it('reads recipe and plan payloads', () => {
    expect(readMealDragPayload(transfer('{"kind":"recipe","recipeId":"r1"}'))).toEqual({
      kind: 'recipe',
      recipeId: 'r1',
    });
    expect(readMealDragPayload(transfer('{"kind":"plan","mealPlanId":"p1"}'))).toEqual({
      kind: 'plan',
      mealPlanId: 'p1',
    });
  });

  it.each([
    '',
    'not json',
    'null',
    '{"kind":"recipe"}',
    '{"kind":"recipe","recipeId":1}',
    '{"kind":"x"}',
  ])('rejects malformed payload %j', raw => {
    expect(readMealDragPayload(transfer(raw))).toBeNull();
  });
});
