'use client';

import { Plus, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import { INGREDIENT_CATEGORY_LABELS } from '@/constants/ingredients';
import { useIngredientSearch } from '@/hooks/ingredients/useIngredientSearch';
import type { IngredientSearchResultDTO } from '@/types/ingredients';

const DEBOUNCE_MS = 300;

interface IngredientComboboxProps {
  selected: IngredientSearchResultDTO | null;
  onSelect: (ingredient: IngredientSearchResultDTO) => void;
  creatingName: string | null;
  onCreateNew: (name: string) => void;
  onClearSelection: () => void;
}

/**
 * Hand-built typeahead — this repo has no `cmdk`/Command primitive, so results render
 * as real focusable buttons (styled like `SelectItem`) instead of a full ARIA
 * `role="combobox"`/roving-tabindex pattern. A "+ Create" affordance always shows
 * alongside live matches so the catalog can grow beyond a fixed list.
 */
export function IngredientCombobox({
  selected,
  onSelect,
  creatingName,
  onCreateNew,
  onClearSelection,
}: IngredientComboboxProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: results = [], isFetching } = useIngredientSearch(debouncedQuery);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <span aria-hidden="true" className="text-xl">
          {selected.icon}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">{selected.name}</p>
          <p className="text-xs text-muted-foreground">
            {INGREDIENT_CATEGORY_LABELS[selected.category]}
          </p>
        </div>
        <button
          aria-label="Change ingredient"
          className="rounded-lg p-2 transition-colors hover:bg-muted"
          type="button"
          onClick={onClearSelection}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  if (creatingName) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Plus aria-hidden="true" className="size-4 text-muted-foreground" />
        <p className="flex-1 text-sm font-medium">Create &quot;{creatingName}&quot;</p>
        <button
          aria-label="Change ingredient"
          className="rounded-lg p-2 transition-colors hover:bg-muted"
          type="button"
          onClick={onClearSelection}
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  const trimmedQuery = query.trim();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div ref={anchorRef} className="relative">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-auto rounded-lg border-border bg-card py-3 pl-9 focus-visible:ring-2 focus-visible:ring-green-500/30"
            placeholder="Search ingredients…"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverAnchor>

      <PopoverContent
        align="start"
        className="p-1"
        onFocusOutside={e => {
          // The input lives in PopoverAnchor, not PopoverTrigger, so Radix doesn't
          // know to exclude it from "outside" detection — without this, focusing/typing
          // in the input while the popover is open gets treated as a dismiss, and
          // `setOpen(true)` from onChange/onFocus is immediately fought back to false,
          // leaving the dropdown permanently stuck closed.
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
        onOpenAutoFocus={e => e.preventDefault()}
        onPointerDownOutside={e => {
          if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
        }}
      >
        <div className="max-h-60 overflow-y-auto">
          {isFetching ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">Searching…</p>
          ) : null}

          {!isFetching && trimmedQuery && results.length === 0 ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">No matches</p>
          ) : null}

          {results.map(ingredient => (
            <button
              key={ingredient.id}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              type="button"
              onClick={() => {
                onSelect(ingredient);
                setOpen(false);
                setQuery('');
              }}
            >
              <span aria-hidden="true" className="text-lg">
                {ingredient.icon}
              </span>
              <span className="flex-1">{ingredient.name}</span>
              <span className="text-xs text-muted-foreground">
                {INGREDIENT_CATEGORY_LABELS[ingredient.category]}
              </span>
            </button>
          ))}

          {trimmedQuery ? (
            <button
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-green-600 hover:bg-accent focus:bg-accent focus:outline-none"
              type="button"
              onClick={() => {
                onCreateNew(trimmedQuery);
                setOpen(false);
                setQuery('');
              }}
            >
              <Plus aria-hidden="true" className="size-4" />
              Create &quot;{trimmedQuery}&quot;
            </button>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
