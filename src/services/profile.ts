import bcrypt from 'bcryptjs';

import { getUserByEmail } from '@/server/auth/queries';
import { deleteUser, updateUserPassword, updateUserProfile } from '@/server/profile/mutations';
import { getAllergyIds, getUserPasswordHash, toUserProfileDTO } from '@/server/profile/queries';
import type { UpdateProfilePayload, UserProfileDTO } from '@/types/profile';

const BCRYPT_ROUNDS = 10;

/** Expected, user-facing failure — actions surface `message` verbatim. */
export class ProfileError extends Error {}

/**
 * Persists the whole profile form in one go: scalar fields on `User` plus the
 * allergy selection, which lives in a separate join table.
 */
export async function saveUserProfile(
  userId: string,
  input: UpdateProfilePayload,
): Promise<UserProfileDTO> {
  const { allergyIds, ...fields } = input;

  const emailOwner = await getUserByEmail(fields.email);
  if (emailOwner && emailOwner.id !== userId) {
    throw new ProfileError('That email is already in use');
  }

  // Drop ids that don't exist so a stale client can't write dangling join rows.
  const validAllergyIds = allergyIds.length > 0 ? await getAllergyIds(allergyIds) : [];

  const user = await updateUserProfile(userId, fields, validAllergyIds);

  return toUserProfileDTO(user);
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const currentHash = await getUserPasswordHash(userId);
  if (!currentHash) {
    throw new ProfileError('This account has no password set');
  }

  const isValid = await bcrypt.compare(currentPassword, currentHash);
  if (!isValid) {
    throw new ProfileError('Current password is incorrect');
  }

  await updateUserPassword(userId, await bcrypt.hash(newPassword, BCRYPT_ROUNDS));
}

/** Verifies the typed confirmation matches the account before the cascade delete. */
export async function deleteUserAccount(userId: string, confirmEmail: string): Promise<void> {
  const user = await getUserByEmail(confirmEmail);

  if (!user || user.id !== userId) {
    throw new ProfileError('The email you typed does not match this account');
  }

  await deleteUser(userId);
}
