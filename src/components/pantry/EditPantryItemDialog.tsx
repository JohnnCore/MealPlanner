'use client';

import type { UnitType } from '@prisma/client';
import { X } from 'lucide-react';
import { useState } from 'react';

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
import { UNIT_OPTIONS } from '@/constants/unit';
import { useUpdatePantryItem } from '@/hooks/pantry/usePantryItem';
import type { PantryItemDTO } from '@/types/pantry';

interface EditPantryItemDialogProps {
  item: PantryItemDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Ingredient is immutable post-creation — only quantity/unit/expiry are editable.
 * `PantryClient` remounts this (via `key={editingItem?.id}`) whenever a different item
 * is opened for editing, so form state can initialize straight from `item` here instead
 * of syncing it in an effect.
 */
export function EditPantryItemDialog({ item, open, onOpenChange }: EditPantryItemDialogProps) {
  const updateItem = useUpdatePantryItem();

  const [quantity, setQuantity] = useState(item ? String(item.quantity) : '1');
  const [unit, setUnit] = useState<UnitType>(item?.unit ?? 'PIECE');
  const [expiresAt, setExpiresAt] = useState(item?.expiresAt ? item.expiresAt.split('T')[0] : '');

  const canSubmit = !!quantity && Number(quantity) > 0;

  const handleSave = () => {
    if (!item || !canSubmit) return;

    updateItem.mutate(
      {
        id: item.id,
        quantity: Number(quantity),
        unit,
        expiresAt: expiresAt || null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex w-full max-w-md flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-2xl"
        showCloseButton={false}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card p-6">
          <DialogTitle className="text-xl font-semibold">Edit Pantry Item</DialogTitle>
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

        <div className="space-y-4 p-6">
          {item ? (
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2">
              <span aria-hidden="true" className="text-xl">
                {item.icon}
              </span>
              <p className="text-sm font-medium">{item.name}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block" htmlFor="edit-pantry-item-qty">
                Quantity
              </Label>
              <Input
                className="h-auto rounded-lg border-border bg-card py-3 focus-visible:ring-2 focus-visible:ring-green-500/30"
                id="edit-pantry-item-qty"
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
            <Label className="mb-2 block" htmlFor="edit-pantry-item-expiry">
              Expiry Date (Optional)
            </Label>
            <Input
              className="h-auto rounded-lg border-border bg-card py-3 focus-visible:ring-2 focus-visible:ring-green-500/30"
              id="edit-pantry-item-expiry"
              type="date"
              value={expiresAt}
              onChange={e => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 rounded-lg bg-muted px-6 py-3 text-foreground transition-colors hover:bg-muted/80"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 rounded-lg bg-green-600 px-6 py-3 text-white shadow-sm transition-colors hover:bg-green-700 disabled:pointer-events-none disabled:opacity-50"
              disabled={!canSubmit || updateItem.isPending}
              type="button"
              onClick={handleSave}
            >
              Save Changes
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
