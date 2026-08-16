import { CategoryColor, ListColor, UnitType } from '@prisma/client';
import * as z from 'zod';

/* -- Shopping list -- */

export const createListSchema = z.object({
  name: z.string().trim().min(1, 'List name is required'),
  color: z.nativeEnum(ListColor).optional(),
});

export type CreateListInput = z.infer<typeof createListSchema>;

export const updateListSchema = z.object({
  name: z.string().trim().min(1).optional(),
  color: z.nativeEnum(ListColor).optional(),
});

export type UpdateListInput = z.infer<typeof updateListSchema>;

/* -- Category -- */

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required'),
  icon: z.string().min(1).default('🛒'),
  color: z.nativeEnum(CategoryColor).default('GREEN'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).optional(),
  icon: z.string().min(1).optional(),
  color: z.nativeEnum(CategoryColor).optional(),
  sortOrder: z.number().int().optional(),
});

export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

/* -- Item -- */

export const createItemSchema = z.object({
  name: z.string().trim().min(1, 'Item name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  quantity: z.number().positive().optional().default(1),
  unit: z.nativeEnum(UnitType),
  notes: z.string().trim().optional(),
  listId: z.string().optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;

export const updateItemSchema = z.object({
  name: z.string().trim().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.nativeEnum(UnitType).optional(),
  notes: z.string().trim().nullable().optional(),
  checked: z.boolean().optional(),
});

export type UpdateItemInput = z.infer<typeof updateItemSchema>;
