'use client';

import { Sparkles } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import type { GenerateRecipeInput } from '@/lib/schemas/recipes';

interface GenerateRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (values: GenerateRecipeInput) => void;
  isGenerating: boolean;
}

const EXAMPLE_PROMPT = 'e.g. "A quick weeknight chicken pasta with whatever vegetables go well"';

export function GenerateRecipeDialog({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
}: GenerateRecipeDialogProps) {
  const [prompt, setPrompt] = useState('');

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) setPrompt('');
  };

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onGenerate({ prompt: prompt.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate a Recipe</DialogTitle>
          <DialogDescription>
            Describe what you want to cook and AI will build a complete recipe for you.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          disabled={isGenerating}
          placeholder={EXAMPLE_PROMPT}
          rows={4}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />

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
