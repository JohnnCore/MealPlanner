'use client';

import type { IngredientCategory, UnitType } from '@prisma/client';
import { useState } from 'react';

import { IngredientCombobox } from '@/components/ingredients/IngredientCombobox';
import { IngredientCreateFields } from '@/components/ingredients/IngredientCreateFields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INGREDIENT_CATEGORY_ICONS } from '@/constants/ingredients';
import { UNIT_OPTIONS } from '@/constants/unit';
import { useShoppingCategories } from '@/hooks/shopping/useShoppingListCategory';
import { useCreateItem } from '@/hooks/shopping/useShoppingListItem';
import type { IngredientSearchResultDTO } from '@/types/ingredients';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Active shopping list id (for cache invalidation) */
  listId: string | undefined;
}

const DEFAULT_INGREDIENT_CATEGORY: IngredientCategory = 'OTHER';

export function AddItemDialog({ open, onOpenChange, listId }: AddItemDialogProps) {
  const { data: categories = [] } = useShoppingCategories();
  const createItem = useCreateItem(listId);

  const [selectedIngredient, setSelectedIngredient] = useState<IngredientSearchResultDTO | null>(
    null,
  );
  const [creatingName, setCreatingName] = useState<string | null>(null);
  const [ingredientCategory, setIngredientCategory] = useState<IngredientCategory>(
    DEFAULT_INGREDIENT_CATEGORY,
  );
  const [ingredientIcon, setIngredientIcon] = useState(
    INGREDIENT_CATEGORY_ICONS[DEFAULT_INGREDIENT_CATEGORY],
  );
  const [iconManuallySet, setIconManuallySet] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<UnitType>('PIECE');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setSelectedIngredient(null);
    setCreatingName(null);
    setIngredientCategory(DEFAULT_INGREDIENT_CATEGORY);
    setIngredientIcon(INGREDIENT_CATEGORY_ICONS[DEFAULT_INGREDIENT_CATEGORY]);
    setIconManuallySet(false);
    setCategoryId('');
    setQuantity('1');
    setUnit('PIECE');
    setNotes('');
  };

  const handleCreateNew = (name: string) => {
    setCreatingName(name);
    setSelectedIngredient(null);
  };

  const handleClearSelection = () => {
    setSelectedIngredient(null);
    setCreatingName(null);
    setIngredientCategory(DEFAULT_INGREDIENT_CATEGORY);
    setIngredientIcon(INGREDIENT_CATEGORY_ICONS[DEFAULT_INGREDIENT_CATEGORY]);
    setIconManuallySet(false);
  };

  const handleIngredientCategoryChange = (next: IngredientCategory) => {
    setIngredientCategory(next);
    if (!iconManuallySet) setIngredientIcon(INGREDIENT_CATEGORY_ICONS[next]);
  };

  const handleIngredientIconChange = (next: string) => {
    setIngredientIcon(next);
    setIconManuallySet(true);
  };

  const canSubmit = !!(selectedIngredient || creatingName) && !!categoryId;

  const handleAdd = () => {
    if (!canSubmit) return;

    createItem.mutate(
      {
        name: selectedIngredient ? selectedIngredient.name : creatingName!,
        categoryId,
        quantity: Number(quantity) || 1,
        unit,
        notes: notes.trim() || undefined,
        ...(selectedIngredient
          ? { ingredientId: selectedIngredient.id }
          : { ingredientCategory, ingredientIcon }),
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ingredient */}
          <div className="space-y-1.5">
            <Label>Ingredient *</Label>
            <IngredientCombobox
              creatingName={creatingName}
              selected={selectedIngredient}
              onClearSelection={handleClearSelection}
              onCreateNew={handleCreateNew}
              onSelect={ingredient => {
                setSelectedIngredient(ingredient);
                setCreatingName(null);
              }}
            />
          </div>

          {creatingName ? (
            <IngredientCreateFields
              category={ingredientCategory}
              icon={ingredientIcon}
              onCategoryChange={handleIngredientCategoryChange}
              onIconChange={handleIngredientIconChange}
            />
          ) : null}

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <span className="flex items-center gap-2">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="item-qty">Quantity</Label>
              <Input
                id="item-qty"
                min={0}
                step="any"
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Select value={unit} onValueChange={v => setUnit(v as UnitType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(u => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="item-notes">Notes (Optional)</Label>
            <Input
              id="item-notes"
              placeholder="e.g., Organic preferred"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={!canSubmit || createItem.isPending}
              onClick={handleAdd}
            >
              Add Item
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
