'use client';

import { Copy, MoreVertical, PenLine, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RecipeDTO } from '@/types/recipes';

interface RecipeActionsMenuProps {
  recipe: RecipeDTO;
  onEdit: (recipe: RecipeDTO) => void;
  onClone: (recipe: RecipeDTO) => void;
  onDelete: (recipe: RecipeDTO) => void;
  className?: string;
}

/** Edit / Clone / Delete for a recipe — shared by the recipe cards and the detail dialog. */
export function RecipeActionsMenu({
  recipe,
  onEdit,
  onClone,
  onDelete,
  className,
}: RecipeActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={`Actions for ${recipe.title}`}
          className={className}
          size="icon"
          type="button"
          variant="secondary"
        >
          <MoreVertical aria-hidden="true" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onEdit(recipe)}>
          <PenLine aria-hidden="true" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onClone(recipe)}>
          <Copy aria-hidden="true" />
          Clone
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(recipe)}>
          <Trash2 aria-hidden="true" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
