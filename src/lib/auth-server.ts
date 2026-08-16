import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import authOptions from '@/lib/auth';

type AuthUser = { id: string; email: string; name: string | null };

/**
 * Returns the authenticated user from the session.
 * For Server Components and Server Actions — redirects to /login if unauthenticated.
 */
export async function requireUser(): Promise<AuthUser> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return session.user;
}

export async function requireUserId(): Promise<string> {
  const user = await requireUser();
  return user.id;
}

/**
 * Returns the authenticated user's id from the session.
 * For API routes — returns a 401 NextResponse instead of redirecting.
 */
export async function requireApiUserId(): Promise<string | NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return session.user.id;
}
