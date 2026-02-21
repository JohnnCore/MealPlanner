'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

type PrivateRouteProps = {
  children: React.ReactNode;
  /** Override the redirect destination. Defaults to "/login". */
  redirectTo?: string;
  /** Shown while the session is being resolved. */
  fallback?: React.ReactNode;
};

/**
 * Client-side auth guard. Redirects to `redirectTo` when the user is not
 * authenticated. proxy.ts already handles the server-side redirect; this
 * component provides the client-side safety net and loading state.
 */
export function PrivateRoute({
  children,
  redirectTo = '/login',
  fallback = null,
}: PrivateRouteProps) {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo);
    }
  }, [isLoading, user, router, redirectTo]);

  if (isLoading) return <>{fallback}</>;
  if (!user) return null;

  return <>{children}</>;
}
