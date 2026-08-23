import prisma from '@/lib/prisma';
import type { UserProfileDTO } from '@/types/profile';

/** Full profile row for the profile page — includes the user's selected allergy ids. */
export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
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

/** The reference allergy catalogue seeded by `prisma/seed.mts`. */
export async function getAllergies() {
  return prisma.allergy.findMany({ orderBy: { name: 'asc' } });
}

export async function getAllergyIds(ids: string[]) {
  const rows = await prisma.allergy.findMany({
    where: { id: { in: ids } },
    select: { id: true },
  });

  return rows.map(row => row.id);
}

/** Password hash lookup for the change-password flow — never expose this to the client. */
export async function getUserPasswordHash(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  return user?.password ?? null;
}

type UserProfileRow = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;

/** Shared shaping used by the profile Server Component and the update action. */
export function toUserProfileDTO(user: UserProfileRow): UserProfileDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    dietType: user.dietType,
    defaultServings: user.defaultServings,
    allowLeftovers: user.allowLeftovers,
    notifyPush: user.notifyPush,
    weeklyDigest: user.weeklyDigest,
    allowSharedLists: user.allowSharedLists,
    allergyIds: user.allergies.map(a => a.allergyId),
  };
}
