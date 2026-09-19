import type { MealType } from '@prisma/client';

import { MEAL_DRAG_MIME } from '@/constants/mealPlan';
import type { MealDragPayload, MealPlanDTO } from '@/types/mealPlan';

/* Planner days are plain calendar dates, passed around as `YYYY-MM-DD` keys so the browser's
 * and server's time zones can never shift a meal onto a different day. */

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` for the given local calendar day. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local-midnight `Date` for a `YYYY-MM-DD` key. */
export function parseDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** UTC-midnight `Date` for a key — the value stored in (and compared against) the `@db.Date` column. */
export function dateKeyToUtc(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday of the week containing `date` — planner weeks start on Monday. */
export function getWeekStart(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = monday.getDay();
  return addDays(monday, day === 0 ? -6 : 1 - day);
}

/** The 7 calendar days (Monday-Sunday) of the week starting on `weekStart`. */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function slotKey(date: string, mealType: MealType): string {
  return `${date}|${mealType}`;
}

/** Index a week's meal plans by slot so each grid cell is a direct lookup. */
export function indexMealPlansBySlot(mealPlans: MealPlanDTO[]): Map<string, MealPlanDTO> {
  return new Map(mealPlans.map(meal => [slotKey(meal.date, meal.mealType), meal]));
}

export function writeMealDragPayload(dataTransfer: DataTransfer, payload: MealDragPayload): void {
  dataTransfer.setData(MEAL_DRAG_MIME, JSON.stringify(payload));
  dataTransfer.effectAllowed = 'move';
}

/** Reads a drop's payload, returning `null` for anything that isn't a well-formed meal drag. */
export function readMealDragPayload(dataTransfer: DataTransfer): MealDragPayload | null {
  try {
    const value: unknown = JSON.parse(dataTransfer.getData(MEAL_DRAG_MIME));
    if (typeof value !== 'object' || value === null) return null;

    if ('kind' in value && value.kind === 'recipe' && 'recipeId' in value) {
      return typeof value.recipeId === 'string'
        ? { kind: 'recipe', recipeId: value.recipeId }
        : null;
    }
    if ('kind' in value && value.kind === 'plan' && 'mealPlanId' in value) {
      return typeof value.mealPlanId === 'string'
        ? { kind: 'plan', mealPlanId: value.mealPlanId }
        : null;
    }
    return null;
  } catch {
    return null;
  }
}
