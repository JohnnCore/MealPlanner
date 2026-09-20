'use client';

import type { UnitType } from '@prisma/client';
import { useState } from 'react';

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
import { UNIT_OPTIONS } from '@/constants/unit';
import type { ShoppingCategoryDTO, ShoppingListItemDTO, UpdateItemPayload } from '@/types/shopping';

interface EditItemDialogProps {
  item: ShoppingListItemDTO | null;
  categories: ShoppingCategoryDTO[];
  isPending: boolean;
  onSave: (id: string, updates: UpdateItemPayload) => void;
  onOpenChange: (open: boolean) => void;
}

interface EditItemFormProps extends Omit<EditItemDialogProps, 'item' | 'onOpenChange'> {
  item: ShoppingListItemDTO;
  onCancel: () => void;
}

/** Mounted only while an item is being edited, so its fields initialise from `item` without effects. */
function EditItemForm({ item, categories, isPending, onSave, onCancel }: EditItemFormProps) {
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [unit, setUnit] = useState<UnitType>(item.unit);
  const [notes, setNotes] = useState(item.notes ?? '');

  const parsedQuantity = Number(quantity);
  const canSubmit = parsedQuantity > 0 && !!categoryId;

  const handleSave = () => {
    if (!canSubmit) return;
    onSave(item.id, {
      categoryId,
      quantity: parsedQuantity,
      unit,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Category</Label>
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="edit-item-qty">Quantity</Label>
          <Input
            id="edit-item-qty"
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

      <div className="space-y-1.5">
        <Label htmlFor="edit-item-notes">Notes (Optional)</Label>
        <Input
          id="edit-item-notes"
          placeholder="e.g., Organic preferred"
          value={notes}
          onChange={e => setNotes(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700"
          disabled={!canSubmit || isPending}
          type="button"
          onClick={handleSave}
        >
          Save
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function EditItemDialog({
  item,
  categories,
  isPending,
  onSave,
  onOpenChange,
}: EditItemDialogProps) {
  return (
    <Dialog open={!!item} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit {item?.name}</DialogTitle>
        </DialogHeader>
        {item ? (
          <EditItemForm
            categories={categories}
            isPending={isPending}
            item={item}
            onCancel={() => onOpenChange(false)}
            onSave={onSave}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
