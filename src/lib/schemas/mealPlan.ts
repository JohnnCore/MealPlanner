import { MealType } from '@prisma/client';
import * as z from 'zod';

const dateKey = z.iso.date();

export const mealPlanRangeSchema = z.object({
  start: dateKey,
  end: dateKey,
});

export const mealSlotSchema = z.object({
  date: dateKey,
  mealType: z.nativeEnum(MealType),
});

export const planMealSchema = mealSlotSchema.extend({
  recipeId: z.string().min(1),
});

export type MealSlotInput = z.infer<typeof mealSlotSchema>;
export type PlanMealInput = z.infer<typeof planMealSchema>;
