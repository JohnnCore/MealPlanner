import type { IngredientSearchResultDTO } from '@/types/ingredients';

export async function fetchIngredientSearch(query: string): Promise<IngredientSearchResultDTO[]> {
  const res = await fetch(`/api/ingredients/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search ingredients');
  return res.json();
}
