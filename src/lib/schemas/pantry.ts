import { IngredientCategory, UnitType } from '@prisma/client';
import * as z from 'zod';

export const addPantryItemSchema = z
  .object({
    ingredientId: z.string().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    category: z.nativeEnum(IngredientCategory).optional(),
    icon: z.string().trim().min(1).optional(),
    quantity: z.number().positive('Quantity must be greater than 0'),
    unit: z.nativeEnum(UnitType),
    expiresAt: z.coerce.date().nullable().optional(),
  })
  .refine(data => !!data.ingredientId || !!(data.name && data.category), {
    message: 'Pick an existing ingredient or provide a name and category for a new one',
    path: ['name'],
  })
  .refine(data => !(data.ingredientId && (data.name || data.category)), {
    message: 'Provide either an existing ingredient or new-ingredient details, not both',
    path: ['ingredientId'],
  });

export type AddPantryItemInput = z.infer<typeof addPantryItemSchema>;

export const updatePantryItemSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0').optional(),
  unit: z.nativeEnum(UnitType).optional(),
  expiresAt: z.coerce.date().nullable().optional(),
});

export type UpdatePantryItemInput = z.infer<typeof updatePantryItemSchema>;
