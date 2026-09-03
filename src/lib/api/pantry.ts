import type { PantryItemDTO } from '@/types/pantry';

/** Reads only — mutations are Server Actions (see src/actions/pantry/actions.ts). */
export async function fetchPantryItems(): Promise<PantryItemDTO[]> {
  const res = await fetch('/api/pantry/items');
  if (!res.ok) throw new Error('Failed to fetch pantry items');
  return res.json();
}
