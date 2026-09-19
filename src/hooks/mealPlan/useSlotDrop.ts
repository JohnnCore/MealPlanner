'use client';

import { useEffect, useRef, useState } from 'react';

import { MEAL_DRAG_MIME } from '@/constants/mealPlan';
import type { MealDragPayload } from '@/types/mealPlan';
import { readMealDragPayload } from '@/utils/mealPlan';

/**
 * Turns an element into a meal drop target using native HTML5 drag-and-drop (no DnD
 * library). Listeners are attached to the ref'd element rather than via JSX props because a
 * plain `<div>` with drop handlers is flagged by jsx-a11y — the accessible way to fill a
 * slot without dragging is the slot's own "Add meal" button. A `disabled` target ignores
 * drags entirely, so the browser shows its "not allowed" cursor.
 */
export function useSlotDrop(onDrop: (payload: MealDragPayload) => void, disabled = false) {
  const ref = useRef<HTMLDivElement>(null);
  const [isOver, setIsOver] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    const handleDragOver = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes(MEAL_DRAG_MIME)) return;
      event.preventDefault();
      setIsOver(true);
    };

    // dragleave also fires when moving onto a child — only clear when actually leaving the slot.
    const handleDragLeave = (event: DragEvent) => {
      if (event.relatedTarget instanceof Node && element.contains(event.relatedTarget)) return;
      setIsOver(false);
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsOver(false);
      const payload = event.dataTransfer ? readMealDragPayload(event.dataTransfer) : null;
      if (payload) onDrop(payload);
    };

    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('drop', handleDrop);
    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('drop', handleDrop);
    };
  }, [onDrop, disabled]);

  return { ref, isOver: isOver && !disabled };
}
