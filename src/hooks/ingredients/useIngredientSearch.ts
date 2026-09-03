import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/queryKeys';
import { fetchIngredientSearch } from '@/lib/api/ingredients';

export function useIngredientSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: queryKeys.ingredients.search(trimmed),
    queryFn: () => fetchIngredientSearch(trimmed),
    enabled: trimmed.length > 0,
  });
}
