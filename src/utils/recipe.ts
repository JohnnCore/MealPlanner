import { CARD_GRADIENTS } from '@/constants/recipe';

export function cardGradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CARD_GRADIENTS[Math.abs(hash) % CARD_GRADIENTS.length];
}
