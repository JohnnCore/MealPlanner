import { Pencil } from 'lucide-react';

import { COLOR_THEMES } from '@/lib/shopping-constants';
import { cn } from '@/lib/utils';
import type { ShoppingCategoryDTO, ShoppingListItemDTO } from '@/types/shopping';

import { ShoppingItemRow } from './ShoppingItemRow';

interface CategoryCardProps {
  category: ShoppingCategoryDTO;
  items: ShoppingListItemDTO[];
  onToggleItem: (item: ShoppingListItemDTO) => void;
  onDeleteItem: (itemId: string) => void;
  onEditCategory: (cat: ShoppingCategoryDTO) => void;
}

export function CategoryCard({
  category,
  items,
  onToggleItem,
  onDeleteItem,
  onEditCategory,
}: CategoryCardProps) {
  const theme = COLOR_THEMES[category.color];
  const completed = items.filter(i => i.checked).length;

  return (
    <div className={cn('rounded-xl border', theme.bg, theme.border)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{category.icon}</span>
          <div>
            <p className="font-semibold leading-tight">{category.name}</p>
            <p className="text-xs text-muted-foreground">
              {completed} / {items.length} completed
            </p>
          </div>
        </div>
        <button
          className="text-muted-foreground hover:text-foreground"
          onClick={() => onEditCategory(category)}
        >
          <Pencil className="size-4" />
        </button>
      </div>

      {/* Mini progress bar */}
      <div className="mx-4 mb-3 h-1.5 overflow-hidden rounded-full bg-white/60">
        <div
          className={cn('h-full rounded-full transition-all', theme.bar)}
          style={{
            width: items.length > 0 ? `${(completed / items.length) * 100}%` : '0%',
          }}
        />
      </div>

      {/* Items */}
      <div className="space-y-0.5 px-2 pb-3">
        {items.map(item => (
          <ShoppingItemRow
            key={item.id}
            item={item}
            onToggle={() => onToggleItem(item)}
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
