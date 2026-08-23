import { DietType } from '@prisma/client';
import * as z from 'zod';

/** Matches the `defaultServings` range offered by the profile form. */
export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 12;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().min(1, 'Email is required').email('Invalid email'),
  dietType: z.nativeEnum(DietType),
  defaultServings: z
    .number()
    .int('Enter a whole number of servings')
    .min(MIN_SERVINGS, `Must be at least ${MIN_SERVINGS}`)
    .max(MAX_SERVINGS, `Must be at most ${MAX_SERVINGS}`),
  allowLeftovers: z.boolean(),
  notifyPush: z.boolean(),
  weeklyDigest: z.boolean(),
  allowSharedLists: z.boolean(),
  allergyIds: z.array(z.string().min(1)),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(data => data.newPassword !== data.currentPassword, {
    message: 'New password must differ from the current one',
    path: ['newPassword'],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

/** Deleting an account is irreversible, so the user must retype their email to confirm. */
export const deleteAccountSchema = z.object({
  confirmEmail: z.string().trim().min(1, 'Please type your email to confirm'),
});

export type DeleteAccountFormValues = z.infer<typeof deleteAccountSchema>;
