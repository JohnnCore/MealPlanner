'use client';

import { ChevronDown, Copy, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LIST_COLOR_THEMES } from '@/lib/shopping-constants';
import { cn } from '@/lib/utils';
import type { ShoppingListSummaryDTO } from '@/types/shopping';

interface ShoppingListSelectorProps {
  lists: ShoppingListSummaryDTO[];
  activeList: ShoppingListSummaryDTO | undefined;
  onSelectList: (listId: string) => void;
  onCreateList: () => void;
  onEditList: (list: ShoppingListSummaryDTO) => void;
  onCloneList: (listId: string) => void;
  onDeleteList: (list: ShoppingListSummaryDTO) => void;
}

export function ShoppingListSelector({
  lists,
  activeList,
  onSelectList,
  onCreateList,
  onEditList,
  onCloneList,
  onDeleteList,
}: ShoppingListSelectorProps) {
  const [open, setOpen] = useState(false);

  const activeTheme =
    (activeList && LIST_COLOR_THEMES[activeList.color]) ?? LIST_COLOR_THEMES.PRIMARY;

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
              activeTheme.solid,
              activeTheme.pillText,
            )}
          >
            <ListChecks className="size-4" />
            <span>{activeList?.name ?? 'Select List'}</span>
            {activeList && (
              <span className="text-xs opacity-80">
                {activeList.itemCount} items &bull; {activeList.checkedCount} completed
              </span>
            )}
            <ChevronDown className="size-4 opacity-70" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="start">
          <div className="p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Shopping Lists
            </p>

            <div className="space-y-1">
              {lists.map(list => {
                const theme = LIST_COLOR_THEMES[list.color] ?? LIST_COLOR_THEMES.PRIMARY;
                const isActive = list.id === activeList?.id;

                return (
                  <div
                    key={list.id}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
                      isActive ? 'bg-accent' : 'hover:bg-accent/50',
                    )}
                  >
                    {/* Clickable row body */}
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => {
                        onSelectList(list.id);
                        setOpen(false);
                      }}
                    >
                      <span className={cn('size-2.5 shrink-0 rounded-full', theme.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{list.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {list.itemCount} items &bull; {list.checkedCount} done
                        </p>
                      </div>
                    </button>

                    {/* Hover action icons */}
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        title="Edit"
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={e => {
                          e.stopPropagation();
                          setOpen(false);
                          onEditList(list);
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        title="Clone"
                        className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                        onClick={e => {
                          e.stopPropagation();
                          onCloneList(list.id);
                        }}
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        title="Delete"
                        className="rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                        onClick={e => {
                          e.stopPropagation();
                          setOpen(false);
                          onDeleteList(list);
                        }}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setOpen(false);
                onCreateList();
              }}
              className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-green-600 transition-colors hover:bg-green-50"
            >
              <Plus className="size-4" />
              Create New List
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <Button variant="outline" size="sm" className="rounded-full" onClick={onCreateList}>
        <Plus className="size-4" />
        New List
      </Button>
    </div>
  );
}
