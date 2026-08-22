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
import { useShoppingCategories } from '@/hooks/shopping/useShoppingListCategory';
import { useCreateItem } from '@/hooks/shopping/useShoppingListItem';
import { UNIT_OPTIONS } from '@/lib/shopping-constants';

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Active shopping list id (for cache invalidation) */
  listId: string | undefined;
}

export function AddItemDialog({ open, onOpenChange, listId }: AddItemDialogProps) {
  const { data: categories = [] } = useShoppingCategories();
  const createItem = useCreateItem(listId);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState<UnitType>('PIECE');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setName('');
    setCategoryId('');
    setQuantity('1');
    setUnit('PIECE');
    setNotes('');
  };

  const handleAdd = () => {
    if (!name.trim() || !categoryId) return;

    createItem.mutate(
      {
        name: name.trim(),
        categoryId,
        quantity: Number(quantity) || 1,
        unit,
        notes: notes.trim() || undefined,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="item-name">Item Name *</Label>
            <Input
              className="border-green-500 focus-visible:ring-green-500/30"
              id="item-name"
              placeholder="e.g., Fresh Tomatoes"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

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
              disabled={!name.trim() || !categoryId || createItem.isPending}
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
