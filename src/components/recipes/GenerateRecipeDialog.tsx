'use client';

import { Info, Sparkles } from 'lucide-react';
import { useState } from 'react';

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
import { Textarea } from '@/components/ui/textarea';
import { DIET_TYPE_LABELS } from '@/constants/profile';
import { MAX_SERVINGS, MIN_SERVINGS } from '@/lib/schemas/profile';
import type { GenerateRecipeInput } from '@/lib/schemas/recipes';
import type { RecipeDietarySummaryDTO } from '@/types/recipes';

interface GenerateRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (values: GenerateRecipeInput) => void;
  isGenerating: boolean;
  dietarySummary: RecipeDietarySummaryDTO;
}

const EXAMPLE_PROMPT = 'e.g. "A quick weeknight chicken pasta with whatever vegetables go well"';

export function GenerateRecipeDialog({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
  dietarySummary,
}: GenerateRecipeDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [servings, setServings] = useState(dietarySummary.defaultServings);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setPrompt('');
      setServings(dietarySummary.defaultServings);
    }
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate({ prompt: prompt.trim(), servings });
  };

  const hasDietConstraint = dietarySummary.dietType !== 'OMNIVORE';
  const hasAllergies = dietarySummary.allergyNames.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate a Recipe</DialogTitle>
          <DialogDescription>
            Describe what you want to cook and AI will build a complete recipe for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            disabled={isGenerating}
            placeholder={EXAMPLE_PROMPT}
            rows={4}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
          />

          <div className="space-y-1.5">
            <Label htmlFor="generate-servings">Servings</Label>
            <Input
              disabled={isGenerating}
              id="generate-servings"
              max={MAX_SERVINGS}
              min={MIN_SERVINGS}
              type="number"
              value={servings}
              onChange={e => setServings(Number(e.target.value) || MIN_SERVINGS)}
            />
          </div>

          {hasDietConstraint || hasAllergies ? (
            <div className="flex items-start gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                {hasDietConstraint ? (
                  <>
                    Respecting your <strong>{DIET_TYPE_LABELS[dietarySummary.dietType]}</strong>{' '}
                    diet
                  </>
                ) : null}
                {hasDietConstraint && hasAllergies ? ' · ' : null}
                {hasAllergies ? <>Avoiding {dietarySummary.allergyNames.join(', ')}</> : null}
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            disabled={isGenerating}
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            disabled={!prompt.trim() || isGenerating}
            type="button"
            onClick={handleSubmit}
          >
            <Sparkles aria-hidden="true" className="size-4" />
            {isGenerating ? 'Generating…' : 'Generate Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
