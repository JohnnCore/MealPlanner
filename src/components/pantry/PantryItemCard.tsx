'use client';

import { AlertCircle, Pencil, Trash2 } from 'lucide-react';

import { INGREDIENT_CATEGORY_LABELS } from '@/constants/ingredients';
import { UNIT_DISPLAY } from '@/constants/unit';
import type { PantryItemDTO } from '@/types/pantry';
import { freshnessColorClass, freshnessLabel } from '@/utils/pantry';

interface PantryItemCardProps {
  item: PantryItemDTO;
  onEdit: (item: PantryItemDTO) => void;
  onDelete: (item: PantryItemDTO) => void;
}

export function PantryItemCard({ item, onEdit, onDelete }: PantryItemCardProps) {
  const { freshnessPercent } = item;

  return (
    <div className="group relative rounded-xl border border-border bg-card p-5 transition-all hover:shadow-lg">
      <button
        aria-label={`Edit ${item.name}`}
        className="absolute top-3 right-11 rounded-lg p-2 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
        type="button"
        onClick={() => onEdit(item)}
      >
        <Pencil className="size-4" />
      </button>
      <button
        aria-label={`Remove ${item.name} from pantry`}
        className="absolute top-3 right-3 rounded-lg p-2 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100"
        type="button"
        onClick={() => onDelete(item)}
      >
        <Trash2 className="size-4 text-destructive" />
      </button>

      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-muted text-3xl">
          {item.icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-1 font-semibold text-foreground">{item.name}</h3>
          <p className="mb-3 text-sm text-muted-foreground">
            {INGREDIENT_CATEGORY_LABELS[item.category]}
          </p>

          <div className="mb-3 flex items-center gap-2">
            <span className="text-lg font-medium text-foreground">
              {item.quantity} {UNIT_DISPLAY[item.unit]}
            </span>
          </div>

          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {freshnessLabel(freshnessPercent)}
              </span>
              {freshnessPercent !== null ? (
                <span className="text-xs text-muted-foreground">{freshnessPercent}%</span>
              ) : null}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all ${freshnessColorClass(freshnessPercent)}`}
                style={{ width: `${freshnessPercent ?? 0}%` }}
              />
            </div>
          </div>

          {item.expiresAt && freshnessPercent !== null && freshnessPercent < 70 ? (
            <div className="flex items-center gap-1 text-xs text-destructive">
              <AlertCircle className="size-3" />
              <span>Exp: {new Date(item.expiresAt).toLocaleDateString()}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
