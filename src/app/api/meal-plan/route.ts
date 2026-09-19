import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireApiUserId } from '@/lib/auth-server';
import { mealPlanRangeSchema } from '@/lib/schemas/mealPlan';
import { getMealPlansForUserInRange, toMealPlanDTO } from '@/server/mealPlan/queries';

/**
 * GET /api/meal-plan?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns the authenticated user's planned meals within a date range (one planner week at
 * a time). Writes live in src/actions/mealPlan/actions.ts (Server Actions).
 */
export async function GET(request: NextRequest) {
  const userId = await requireApiUserId();
  if (userId instanceof NextResponse) return userId;

  const parsed = mealPlanRangeSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid date range' }, { status: 400 });

  const mealPlans = await getMealPlansForUserInRange(userId, parsed.data.start, parsed.data.end);

  return NextResponse.json(mealPlans.map(toMealPlanDTO));
}
