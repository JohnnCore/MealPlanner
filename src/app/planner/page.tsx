import { requireUserId } from '@/lib/auth-server';
import { getMealPlansForUserInRange, toMealPlanDTO } from '@/server/mealPlan/queries';
import { getRecipesByAuthorId, toRecipeDTO } from '@/server/recipes/queries';
import { addDays, getWeekStart, toDateKey } from '@/utils/mealPlan';

import { PlannerClient } from './PlannerClient';

export default async function PlannerPage() {
  const userId = await requireUserId();

  const weekStart = getWeekStart(new Date());
  const [mealPlans, recipes] = await Promise.all([
    getMealPlansForUserInRange(userId, toDateKey(weekStart), toDateKey(addDays(weekStart, 6))),
    getRecipesByAuthorId(userId),
  ]);

  return (
    <PlannerClient
      initialMealPlans={mealPlans.map(toMealPlanDTO)}
      initialWeekStartKey={toDateKey(weekStart)}
      recipes={recipes.map(toRecipeDTO)}
    />
  );
}
