'use client';

import type { IngredientCategory, RecipeDifficulty, UnitType } from '@prisma/client';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { IngredientCombobox } from '@/components/ingredients/IngredientCombobox';
import { IngredientCreateFields } from '@/components/ingredients/IngredientCreateFields';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { INGREDIENT_CATEGORY_ICONS } from '@/constants/ingredients';
import { DIFFICULTIES, DIFFICULTY_LABELS } from '@/constants/recipe';
import { UNIT_OPTIONS } from '@/constants/unit';
import { MAX_SERVINGS, MIN_SERVINGS } from '@/lib/schemas/profile';
import { type SaveRecipeInput, saveRecipeSchema } from '@/lib/schemas/recipes';
import type { IngredientSearchResultDTO } from '@/types/ingredients';
import type { RecipeDTO } from '@/types/recipes';

interface RecipeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Set to edit an existing recipe (hand-written or AI-generated); omit to create a new one. */
  recipe?: RecipeDTO | null;
  defaultServings: number;
  isSaving: boolean;
  onSave: (values: SaveRecipeInput) => void;
}

/** One editable ingredient line — existing catalogue rows carry an id, new ones name + category. */
interface IngredientRow {
  key: string;
  ingredientId?: string;
  name: string;
  category?: IngredientCategory;
  icon?: string;
  quantity: string;
  unit: UnitType;
}

const DEFAULT_CATEGORY: IngredientCategory = 'OTHER';
const FIELD_CLASS = 'h-auto rounded-lg border-border bg-card py-3';

let rowCounter = 0;
const nextKey = () => `row-${rowCounter++}`;

/**
 * Mount it fresh per recipe (give it a `key`) — form state is seeded from `recipe` once,
 * on mount, rather than synced through effects.
 */
export function RecipeFormDialog({
  open,
  onOpenChange,
  recipe,
  defaultServings,
  isSaving,
  onSave,
}: RecipeFormDialogProps) {
  const [title, setTitle] = useState(recipe?.title ?? '');
  const [description, setDescription] = useState(recipe?.description ?? '');
  const [servings, setServings] = useState(String(recipe?.servings ?? defaultServings));
  const [cookTime, setCookTime] = useState(String(recipe?.cookTimeMinutes ?? 30));
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>(recipe?.difficulty ?? 'EASY');
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    () =>
      recipe?.ingredients.map(i => ({
        key: nextKey(),
        ingredientId: i.ingredientId,
        name: i.name,
        quantity: String(i.quantity),
        unit: i.unit,
      })) ?? [],
  );
  const [steps, setSteps] = useState<string[]>(recipe?.instructions ?? ['']);
  const [error, setError] = useState<string | null>(null);

  // "Add ingredient" mini-form — same pick-or-create flow as the pantry dialog.
  const [selected, setSelected] = useState<IngredientSearchResultDTO | null>(null);
  const [creatingName, setCreatingName] = useState<string | null>(null);
  const [category, setCategory] = useState<IngredientCategory>(DEFAULT_CATEGORY);
  const [icon, setIcon] = useState(INGREDIENT_CATEGORY_ICONS[DEFAULT_CATEGORY]);
  const [iconManuallySet, setIconManuallySet] = useState(false);
  const [newQuantity, setNewQuantity] = useState('1');
  const [newUnit, setNewUnit] = useState<UnitType>('GRAM');

  const resetAdder = () => {
    setSelected(null);
    setCreatingName(null);
    setCategory(DEFAULT_CATEGORY);
    setIcon(INGREDIENT_CATEGORY_ICONS[DEFAULT_CATEGORY]);
    setIconManuallySet(false);
    setNewQuantity('1');
  };

  const canAddIngredient = !!(selected || creatingName) && Number(newQuantity) > 0;

  const handleAddIngredient = () => {
    if (!canAddIngredient) return;

    const row: IngredientRow = selected
      ? {
          key: nextKey(),
          ingredientId: selected.id,
          name: selected.name,
          quantity: newQuantity,
          unit: newUnit,
        }
      : {
          key: nextKey(),
          name: creatingName!,
          category,
          icon,
          quantity: newQuantity,
          unit: newUnit,
        };

    setIngredients(prev => [...prev, row]);
    resetAdder();
  };

  const updateIngredient = (key: string, patch: Partial<IngredientRow>) =>
    setIngredients(prev => prev.map(row => (row.key === key ? { ...row, ...patch } : row)));

  const updateStep = (index: number, value: string) =>
    setSteps(prev => prev.map((step, i) => (i === index ? value : step)));

  const moveStep = (from: number, to: number) =>
    setSteps(prev => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });

  const handleSubmit = () => {
    const parsed = saveRecipeSchema.safeParse({
      title,
      description,
      servings: Number(servings),
      cookTimeMinutes: Number(cookTime),
      difficulty,
      ingredients: ingredients.map(row => ({
        ...(row.ingredientId
          ? { ingredientId: row.ingredientId }
          : { name: row.name, category: row.category, icon: row.icon }),
        quantity: Number(row.quantity),
        unit: row.unit,
      })),
      // Blank steps are just leftover empty fields, not an error worth blocking on.
      instructions: steps.filter(step => step.trim()),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the recipe and try again');
      return;
    }

    setError(null);
    onSave(parsed.data);
  };

  const isEditing = !!recipe;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border p-6">
          <DialogTitle>{isEditing ? 'Edit Recipe' : 'Create a Recipe'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Change anything — ingredients, quantities and steps.'
              : 'Write your own recipe with its ingredients, quantities and steps.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto p-6">
          <div className="space-y-1.5">
            <Label htmlFor="recipe-title">Title</Label>
            <Input
              className={FIELD_CLASS}
              id="recipe-title"
              maxLength={120}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="recipe-description">Description (optional)</Label>
            <Textarea
              id="recipe-description"
              maxLength={500}
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="recipe-servings">Servings</Label>
              <Input
                className={FIELD_CLASS}
                id="recipe-servings"
                max={MAX_SERVINGS}
                min={MIN_SERVINGS}
                type="number"
                value={servings}
                onChange={e => setServings(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recipe-cook-time">Cook time (min)</Label>
              <Input
                className={FIELD_CLASS}
                id="recipe-cook-time"
                min={1}
                type="number"
                value={cookTime}
                onChange={e => setCookTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={v => setDifficulty(v as RecipeDifficulty)}>
                <SelectTrigger className={`${FIELD_CLASS} w-full`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => (
                    <SelectItem key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* -- Ingredients -- */}
          <section className="space-y-3">
            <h3 className="font-semibold">Ingredients</h3>

            {ingredients.length > 0 ? (
              <ul className="space-y-2">
                {ingredients.map(row => (
                  <li key={row.key} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
                    <Input
                      aria-label={`Quantity of ${row.name}`}
                      className="w-24"
                      min={0}
                      step="any"
                      type="number"
                      value={row.quantity}
                      onChange={e => updateIngredient(row.key, { quantity: e.target.value })}
                    />
                    <Select
                      value={row.unit}
                      onValueChange={v => updateIngredient(row.key, { unit: v as UnitType })}
                    >
                      <SelectTrigger aria-label={`Unit of ${row.name}`} className="w-24">
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
                    <Button
                      aria-label={`Remove ${row.name}`}
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => setIngredients(prev => prev.filter(r => r.key !== row.key))}
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <IngredientCombobox
                creatingName={creatingName}
                selected={selected}
                onClearSelection={resetAdder}
                onCreateNew={name => {
                  setCreatingName(name);
                  setSelected(null);
                }}
                onSelect={ingredient => {
                  setSelected(ingredient);
                  setCreatingName(null);
                }}
              />

              {creatingName ? (
                <IngredientCreateFields
                  category={category}
                  icon={icon}
                  onCategoryChange={next => {
                    setCategory(next);
                    if (!iconManuallySet) setIcon(INGREDIENT_CATEGORY_ICONS[next]);
                  }}
                  onIconChange={next => {
                    setIcon(next);
                    setIconManuallySet(true);
                  }}
                />
              ) : null}

              <div className="flex items-center gap-2">
                <Input
                  aria-label="Quantity"
                  className="w-24"
                  min={0}
                  step="any"
                  type="number"
                  value={newQuantity}
                  onChange={e => setNewQuantity(e.target.value)}
                />
                <Select value={newUnit} onValueChange={v => setNewUnit(v as UnitType)}>
                  <SelectTrigger aria-label="Unit" className="w-24">
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
                <Button
                  disabled={!canAddIngredient}
                  type="button"
                  variant="outline"
                  onClick={handleAddIngredient}
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Add ingredient
                </Button>
              </div>
            </div>
          </section>

          {/* -- Steps -- */}
          <section className="space-y-3">
            <h3 className="font-semibold">Instructions</h3>
            <ol className="space-y-2">
              {steps.map((step, i) => (
                // Steps have no identity beyond their position, so the index is the key.

                <li key={i} className="flex items-start gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-300 mt-2">
                    {i + 1}
                  </span>
                  <Textarea
                    aria-label={`Step ${i + 1}`}
                    rows={2}
                    value={step}
                    onChange={e => updateStep(i, e.target.value)}
                  />
                  <div className="flex flex-col">
                    <Button
                      aria-label={`Move step ${i + 1} up`}
                      className="size-6"
                      disabled={i === 0}
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => moveStep(i, i - 1)}
                    >
                      <ArrowUp aria-hidden="true" className="size-4" />
                    </Button>
                    <Button
                      aria-label={`Move step ${i + 1} down`}
                      className="size-6"
                      disabled={i === steps.length - 1}
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => moveStep(i, i + 1)}
                    >
                      <ArrowDown aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                  <Button
                    aria-label={`Remove step ${i + 1}`}
                    disabled={steps.length === 1}
                    size="icon"
                    type="button"
                    variant="ghost"
                    onClick={() => setSteps(prev => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 aria-hidden="true" className="size-4" />
                  </Button>
                </li>
              ))}
            </ol>
            <Button type="button" variant="outline" onClick={() => setSteps(prev => [...prev, ''])}>
              <Plus aria-hidden="true" className="size-4" />
              Add step
            </Button>
          </section>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="border-t border-border p-6">
          <Button
            disabled={isSaving}
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            disabled={isSaving}
            type="button"
            onClick={handleSubmit}
          >
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
