'use server';

import { requireUserId } from '@/lib/auth-server';
import {
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from '@/lib/schemas/profile';
import {
  changeUserPassword,
  deleteUserAccount,
  ProfileError,
  saveUserProfile,
} from '@/services/profile';
import type { ActionResult } from '@/types/action';
import type { UserProfileDTO } from '@/types/profile';

export async function updateProfileAction(input: unknown): Promise<ActionResult<UserProfileDTO>> {
  const userId = await requireUserId();

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid profile data' };

  try {
    return { success: true, data: await saveUserProfile(userId, parsed.data) };
  } catch (e) {
    if (e instanceof ProfileError) return { error: e.message };
    // Unique-constraint race: another request claimed the email between check and write.
    if (e instanceof Error && /unique|duplicate/i.test(e.message) && /email/i.test(e.message)) {
      return { error: 'That email is already in use' };
    }
    throw e;
  }
}

export async function changePasswordAction(input: unknown): Promise<ActionResult<null>> {
  const userId = await requireUserId();

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: 'Invalid password data' };

  try {
    await changeUserPassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
    return { success: true, data: null };
  } catch (e) {
    if (e instanceof ProfileError) return { error: e.message };
    throw e;
  }
}

export async function deleteAccountAction(input: unknown): Promise<ActionResult<null>> {
  const userId = await requireUserId();

  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return { error: 'Please type your email to confirm' };

  try {
    await deleteUserAccount(userId, parsed.data.confirmEmail);
    return { success: true, data: null };
  } catch (e) {
    if (e instanceof ProfileError) return { error: e.message };
    throw e;
  }
}
