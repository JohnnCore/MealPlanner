import { useMutation } from '@tanstack/react-query';

import {
  changePasswordAction,
  deleteAccountAction,
  updateProfileAction,
} from '@/actions/profile/actions';
import type { ChangePasswordFormValues, UpdateProfileFormValues } from '@/lib/schemas/profile';
import { unwrapAction } from '@/utils/action';

/**
 * Profile mutations run through React Query purely for its pending/error lifecycle
 * and the global MutationCache toasts — there is no profile `useQuery` to invalidate,
 * since the page's initial data comes from its Server Component.
 */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: (values: UpdateProfileFormValues) => unwrapAction(updateProfileAction(values)),
    // No successMessage: the Save button switches to a "Saved" state on success.
    meta: { errorMessage: 'Failed to save profile' },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (values: ChangePasswordFormValues) => unwrapAction(changePasswordAction(values)),
    meta: { successMessage: 'Password updated', errorMessage: 'Failed to update password' },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: (confirmEmail: string) => unwrapAction(deleteAccountAction({ confirmEmail })),
    meta: { errorMessage: 'Failed to delete account' },
  });
}
