'use client';

import type { UnitType } from '@prisma/client';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UNIT_DISPLAY } from '@/constants/unit';
import { useShoppingCategories } from '@/hooks/shopping/useShoppingListCategory';
import { useQuickAddToShoppingList } from '@/hooks/shopping/useShoppingListItem';

interface AddMissingIngredientButtonProps {
  ingredientId: string;
  name: string;
  suggestedQuantity: number;
  unit: UnitType;
}

/** Lets the user add a missing/short recipe ingredient straight to their shopping list. */
export function AddMissingIngredientButton({
  ingredientId,
  name,
  suggestedQuantity,
  unit,
}: AddMissingIngredientButtonProps) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState(String(suggestedQuantity));
  const { data: categories = [] } = useShoppingCategories();
  const addItem = useQuickAddToShoppingList();

  const handleAdd = () => {
    if (!categoryId) return;

    addItem.mutate(
      {
        name,
        ingredientId,
        categoryId,
        quantity: Number(quantity) || suggestedQuantity,
        unit,
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <Plus aria-hidden="true" className="size-4" />
          Add to list
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 space-y-3">
        <p className="text-sm font-medium">Add {name} to shopping list</p>

        <div className="grid grid-cols-2 gap-2">
          <Input
            aria-label="Quantity"
            min={0}
            step="any"
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
          />
          <div className="flex h-9 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">
            {UNIT_DISPLAY[unit] ?? unit}
          </div>
        </div>

        {categories.length > 0 ? (
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <span className="flex items-center gap-2">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="text-xs text-muted-foreground">
            Create a category on the shopping list page first.
          </p>
        )}

        <Button
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={!categoryId || addItem.isPending}
          type="button"
          onClick={handleAdd}
        >
          {addItem.isPending ? 'Adding…' : 'Add'}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
