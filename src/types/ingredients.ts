import type { IngredientCategory } from '@prisma/client';

export interface IngredientSearchResultDTO {
  id: string;
  name: string;
  icon: string;
  category: IngredientCategory;
}
