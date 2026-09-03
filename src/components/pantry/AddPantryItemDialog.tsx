'use client';

import type { IngredientCategory, UnitType } from '@prisma/client';
import { X } from 'lucide-react';
import { useState } from 'react';

import { IngredientCombobox } from '@/components/ingredients/IngredientCombobox';
import { IngredientCreateFields } from '@/components/ingredients/IngredientCreateFields';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
import { useCreatePantryItem } from '@/hooks/pantry/usePantryItem';
import type { IngredientSearchResultDTO } from '@/types/ingredients';

interface AddPantryItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CATEGORY: IngredientCategory = 'OTHER';

export function AddPantryItemDialog({ open, onOpenChange }: AddPantryItemDialogProps) {
  const createItem = useCreatePantryItem();

  const [selectedIngredient, setSelectedIngredient] = useState<IngredientSearchResultDTO | null>(
    null,
  );
  const [creatingName, setCreatingName] = useState<string | null>(null);
  const [category, setCategory] = useState<IngredientCategory>(DEFAULT_CATEGORY);
  const [icon, setIcon] = useState(INGREDIENT_CATEGORY_ICONS[DEFAULT_CATEGORY]);
  const [iconManuallySet, setIconManuallySet] = useState(false);

  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<UnitType>('PIECE');
  const [expiresAt, setExpiresAt] = useState('');

  const resetForm = () => {
    setSelectedIngredient(null);
    setCreatingName(null);
    setCategory(DEFAULT_CATEGORY);
    setIcon(INGREDIENT_CATEGORY_ICONS[DEFAULT_CATEGORY]);
    setIconManuallySet(false);
    setQuantity('1');
    setUnit('PIECE');
    setExpiresAt('');
  };

  const handleCreateNew = (name: string) => {
    setCreatingName(name);
    setSelectedIngredient(null);
  };

  const handleClearSelection = () => {
    setSelectedIngredient(null);
    setCreatingName(null);
    setCategory(DEFAULT_CATEGORY);
    setIcon(INGREDIENT_CATEGORY_ICONS[DEFAULT_CATEGORY]);
    setIconManuallySet(false);
  };

  const handleCategoryChange = (next: IngredientCategory) => {
    setCategory(next);
    if (!iconManuallySet) setIcon(INGREDIENT_CATEGORY_ICONS[next]);
  };

  const handleIconChange = (next: string) => {
    setIcon(next);
    setIconManuallySet(true);
  };

  const canSubmit = !!(selectedIngredient || creatingName) && !!quantity && Number(quantity) > 0;

  const handleAdd = () => {
    if (!canSubmit) return;

    createItem.mutate(
      {
        ...(selectedIngredient
          ? { ingredientId: selectedIngredient.id }
          : { name: creatingName!, category, icon }),
        quantity: Number(quantity),
        unit,
        expiresAt: expiresAt || undefined,
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
      <DialogContent
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl"
        showCloseButton={false}
      >
        <div className="sticky top-0 flex shrink-0 items-center justify-between border-b border-border bg-card p-6">
          <DialogTitle className="text-xl font-semibold">Add Ingredient</DialogTitle>
          <DialogClose asChild>
            <button
              aria-label="Close"
              className="rounded-lg p-2 transition-colors hover:bg-muted"
              type="button"
            >
              <X className="size-5" />
            </button>
          </DialogClose>
        </div>

        <div className="space-y-4 overflow-y-auto p-6">
          <div className="space-y-2">
            <Label className="mb-0 block">Select Ingredient</Label>
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
              category={category}
              icon={icon}
              onCategoryChange={handleCategoryChange}
              onIconChange={handleIconChange}
            />
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block" htmlFor="pantry-item-qty">
                Quantity
              </Label>
              <Input
                className="h-auto rounded-lg border-border bg-card py-3 focus-visible:ring-2 focus-visible:ring-green-500/30"
                id="pantry-item-qty"
                min={0}
                step="any"
                type="number"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Unit</Label>
              <Select value={unit} onValueChange={v => setUnit(v as UnitType)}>
                <SelectTrigger className="h-auto w-full rounded-lg border-border bg-card py-3 focus-visible:ring-2 focus-visible:ring-green-500/30">
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

          <div>
            <Label className="mb-2 block" htmlFor="pantry-item-expiry">
              Expiry Date (Optional)
            </Label>
            <Input
              className="h-auto rounded-lg border-border bg-card py-3 focus-visible:ring-2 focus-visible:ring-green-500/30"
              id="pantry-item-expiry"
              min={new Date().toISOString().split('T')[0]}
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 rounded-lg bg-muted px-6 py-3 text-foreground transition-colors hover:bg-muted/80"
              type="button"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-lg bg-green-600 px-6 py-3 text-white shadow-sm transition-colors hover:bg-green-700 disabled:pointer-events-none disabled:opacity-50"
              disabled={!canSubmit || createItem.isPending}
              type="button"
              onClick={handleAdd}
            >
              Add to Pantry
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
