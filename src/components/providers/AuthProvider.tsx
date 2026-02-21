'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuthStore } from '@/stores/authStore';

/**
 * Syncs the NextAuth session into the Zustand auth store so components
 * can access user data without calling useSession everywhere.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setUser, setLoading, clearUser } = useAuthStore();

  useEffect(() => {
    if (status === 'loading') {
      setLoading(true);
      return;
    }

    if (status === 'authenticated' && session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.name ?? null,
      });
    } else {
      clearUser();
    }

    setLoading(false);
  }, [status, session, setUser, setLoading, clearUser]);

  return <>{children}</>;
}
