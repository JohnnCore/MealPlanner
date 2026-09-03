'use server';

import { requireUserId } from '@/lib/auth-server';
import { addPantryItemSchema, updatePantryItemSchema } from '@/lib/schemas/pantry';
import { deletePantryItem, updatePantryItem } from '@/server/pantry/mutations';
import { getPantryItemByIdAndUser, toPantryItemDTO } from '@/server/pantry/queries';
import { addPantryItem, PantryError } from '@/services/pantry';
import type { ActionResult } from '@/types/action';
import type { PantryItemDTO } from '@/types/pantry';

export async function addPantryItemAction(input: unknown): Promise<ActionResult<PantryItemDTO>> {
  const userId = await requireUserId();

  const parsed = addPantryItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid item data' };

  try {
    const item = await addPantryItem(userId, parsed.data);
    return { success: true, data: item };
  } catch (e) {
    if (e instanceof PantryError) return { error: e.message };
    throw e;
  }
}

export async function updatePantryItemAction(
  id: string,
  input: unknown,
): Promise<ActionResult<PantryItemDTO>> {
  const userId = await requireUserId();

  const parsed = updatePantryItemSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid item data' };

  const existing = await getPantryItemByIdAndUser(id, userId);
  if (!existing) return { error: 'Pantry item not found' };

  const updated = await updatePantryItem(id, {
    ...parsed.data,
    expiresAt: parsed.data.expiresAt === undefined ? undefined : parsed.data.expiresAt,
  });

  return { success: true, data: toPantryItemDTO(updated) };
}

export async function deletePantryItemAction(id: string): Promise<ActionResult<null>> {
  const userId = await requireUserId();

  const existing = await getPantryItemByIdAndUser(id, userId);
  if (!existing) return { error: 'Pantry item not found' };

  await deletePantryItem(id);
  return { success: true, data: null };
}
