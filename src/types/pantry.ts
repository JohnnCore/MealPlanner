import type { IngredientCategory, UnitType } from '@prisma/client';

export interface PantryItemDTO {
  id: string;
  ingredientId: string;
  name: string;
  icon: string;
  category: IngredientCategory;
  quantity: number;
  unit: UnitType;
  expiresAt: string | null;
  /** Derived, not stored — see `utils/pantry.ts`. `null` when there's no expiry date. */
  freshnessPercent: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Either `ingredientId` (an existing/visible ingredient) or `name`+`category` (create new) must be set. */
export interface CreatePantryItemPayload {
  ingredientId?: string;
  name?: string;
  category?: IngredientCategory;
  icon?: string;
  quantity: number;
  unit: UnitType;
  expiresAt?: string | null;
}

export interface UpdatePantryItemPayload {
  quantity?: number;
  unit?: UnitType;
  expiresAt?: string | null;
}
