import { Trash2 } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { UNIT_DISPLAY } from '@/lib/shopping-constants';
import { cn } from '@/lib/utils';
import type { ShoppingListItemDTO } from '@/types/shopping';

interface ShoppingItemRowProps {
  item: ShoppingListItemDTO;
  onToggle: () => void;
  onDelete: () => void;
}

export function ShoppingItemRow({ item, onToggle, onDelete }: ShoppingItemRowProps) {
  const unitLabel = UNIT_DISPLAY[item.unit] ?? item.unit;

  return (
    <div className="group flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-white/50">
      <Checkbox
        checked={item.checked}
        onCheckedChange={onToggle}
        className={cn(
          'size-5',
          item.checked &&
            'border-green-600 bg-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600',
        )}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium leading-tight',
            item.checked && 'text-muted-foreground line-through',
          )}
        >
          {item.name}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {item.quantity} {unitLabel}
          </span>
          {item.source && (
            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
              ✦ {item.source}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
