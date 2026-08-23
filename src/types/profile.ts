import type { DietType } from '@prisma/client';

/**
 * The profile page's view of the user.
 * Diverges from the Prisma `User` shape: the `UserAllergy` join rows are
 * flattened to a plain id list, and `password` is never carried.
 */
export interface UserProfileDTO {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  dietType: DietType;
  defaultServings: number;
  allowLeftovers: boolean;
  notifyPush: boolean;
  weeklyDigest: boolean;
  allowSharedLists: boolean;
  allergyIds: string[];
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  dietType: DietType;
  defaultServings: number;
  allowLeftovers: boolean;
  notifyPush: boolean;
  weeklyDigest: boolean;
  allowSharedLists: boolean;
  allergyIds: string[];
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
