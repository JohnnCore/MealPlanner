import { MealType } from '@prisma/client';

/** Slot order within a day. */
export const MEAL_TYPES = Object.values(MealType);

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
};

/** Custom drag-and-drop MIME type — keeps unrelated drags (files, text) from being accepted as meals. */
export const MEAL_DRAG_MIME = 'application/x-meal-planner';
