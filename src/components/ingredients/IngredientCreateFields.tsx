'use client';

import type { IngredientCategory } from '@prisma/client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { INGREDIENT_CATEGORIES, INGREDIENT_CATEGORY_LABELS } from '@/constants/ingredients';

interface IngredientCreateFieldsProps {
  category: IngredientCategory;
  onCategoryChange: (category: IngredientCategory) => void;
  icon: string;
  onIconChange: (icon: string) => void;
}

/** Shown only while `IngredientCombobox` is in "create new" mode. */
export function IngredientCreateFields({
  category,
  onCategoryChange,
  icon,
  onIconChange,
}: IngredientCreateFieldsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label className="mb-2 block">Category</Label>
        <Select value={category} onValueChange={v => onCategoryChange(v as IngredientCategory)}>
          <SelectTrigger className="h-auto w-full rounded-lg border-border bg-card py-3 focus-visible:ring-2 focus-visible:ring-green-500/30">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INGREDIENT_CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {INGREDIENT_CATEGORY_LABELS[cat]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block" htmlFor="new-ingredient-icon">
          Icon
        </Label>
        <Input
          className="h-auto rounded-lg border-border bg-card py-3 focus-visible:ring-2 focus-visible:ring-green-500/30"
          id="new-ingredient-icon"
          maxLength={4}
          value={icon}
          onChange={e => onIconChange(e.target.value)}
        />
      </div>
    </div>
  );
}
