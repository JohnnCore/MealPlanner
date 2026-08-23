import type { AIGenerationType, Prisma } from '@prisma/client';

import prisma from '@/lib/prisma';

/** Audit log of every AI call — prompt, raw response, and token cost, per user. */
export async function createAIGeneration(data: {
  userId: string;
  type: AIGenerationType;
  prompt: Prisma.InputJsonValue;
  response: Prisma.InputJsonValue;
  tokensUsed: number | null;
}) {
  return prisma.aIGeneration.create({ data });
}
