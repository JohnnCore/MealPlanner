import { redirect } from 'next/navigation';

import { requireUserId } from '@/lib/auth-server';
import { getAllergies, getUserProfile, toUserProfileDTO } from '@/server/profile/queries';

import { ProfileClient } from './ProfileClient';

export default async function ProfilePage() {
  const userId = await requireUserId();

  const [user, allergies] = await Promise.all([getUserProfile(userId), getAllergies()]);

  // A valid JWT for a deleted user (e.g. after a DB reset) — force a fresh sign-in.
  if (!user) redirect('/login');

  return <ProfileClient allergies={allergies} initialProfile={toUserProfileDTO(user)} />;
}
