import type { DietType } from '@prisma/client';

import prisma from '@/lib/prisma';

interface UpdateUserProfileData {
  name?: string;
  email?: string;
  dietType?: DietType;
  defaultServings?: number;
  allowLeftovers?: boolean;
  notifyPush?: boolean;
  weeklyDigest?: boolean;
  allowSharedLists?: boolean;
}

/**
 * Updates the scalar profile fields and replaces the allergy selection in a single
 * atomic write, so a failed email-uniqueness check can never leave the join table
 * out of sync with the rest of the profile.
 */
export async function updateUserProfile(
  userId: string,
  data: UpdateUserProfileData,
  allergyIds: string[],
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      allergies: {
        deleteMany: {},
        createMany: { data: allergyIds.map(allergyId => ({ allergyId })) },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      dietType: true,
      defaultServings: true,
      allowLeftovers: true,
      notifyPush: true,
      weeklyDigest: true,
      allowSharedLists: true,
      allergies: { select: { allergyId: true } },
    },
  });
}

export async function updateUserPassword(userId: string, hashedPassword: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });
}

/** Cascades to pantry, recipes, meal plans, shopping lists and AI generations. */
export async function deleteUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
