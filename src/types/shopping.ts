import type { CategoryColor, IngredientCategory, ListColor, UnitType } from '@prisma/client';

/* -- Shopping list -- */

export interface ShoppingListSummaryDTO {
  id: string;
  name: string;
  color: ListColor;
  itemCount: number;
  checkedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateListPayload {
  name: string;
  color: ListColor;
}

export interface UpdateListPayload {
  name?: string;
  color?: ListColor;
}

/* -- Category -- */

export interface ShoppingCategoryDTO {
  id: string;
  name: string;
  icon: string;
  color: CategoryColor;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  icon: string;
  color: CategoryColor;
}

export interface UpdateCategoryPayload {
  name?: string;
  icon?: string;
  color?: CategoryColor;
  sortOrder?: number;
}

/* -- Shopping list item -- */

export interface ShoppingListItemDTO {
  id: string;
  shoppingListId: string;
  categoryId: string;
  ingredientId: string | null;
  name: string;
  quantity: number;
  unit: UnitType;
  notes: string | null;
  checked: boolean;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  name: string;
  categoryId: string;
  quantity: number;
  unit: UnitType;
  notes?: string;
  listId?: string;
  /** Either ingredientId (picking an existing/visible ingredient) or ingredientCategory
   * (creating a new one) must be set. */
  ingredientId?: string;
  ingredientCategory?: IngredientCategory;
  ingredientIcon?: string;
}

export interface UpdateItemPayload {
  name?: string;
  categoryId?: string;
  quantity?: number;
  unit?: UnitType;
  notes?: string | null;
  checked?: boolean;
}

/* -- Aggregated data for the shopping list page -- */

export interface ShoppingListData {
  shoppingListId: string;
  categories: ShoppingCategoryDTO[];
  items: ShoppingListItemDTO[];
}

/* -- Color theme config -- */

export interface ColorTheme {
  label: string;
  /** Card background (very light tint) */
  bg: string;
  /** Header bar / progress bar background */
  bar: string;
  /** Border accent */
  border: string;
  /** Text color for percentage / accents */
  text: string;
  /** Pill background in category picker */
  pill: string;
  /** Pill text */
  pillText: string;
}

export interface ListColorTheme {
  label: string;
  /** Solid background for the selector pill & dot */
  solid: string;
  /** Dot color class (for the list dropdown) */
  dot: string;
  /** Pill text color */
  pillText: string;
}
