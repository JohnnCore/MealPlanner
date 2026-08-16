'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

type PrivateRouteProps = {
  children: React.ReactNode;
  /** Override the redirect destination. Defaults to "/login". */
  redirectTo?: string;
  /** Shown while the session is being resolved. */
  fallback?: React.ReactNode;
};

/**
 * Client-side auth guard for pages that stay client components end-to-end
 * (no server-fetched initial data). proxy.ts and requireUser()/requireUserId()
 * are the real security boundary — this is only a UX safety net that avoids
 * a flash of protected content while the session resolves.
 */
export function PrivateRoute({
  children,
  redirectTo = '/login',
  fallback = null,
}: PrivateRouteProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(redirectTo);
    }
  }, [status, router, redirectTo]);

  if (status === 'loading') return <>{fallback}</>;
  if (!session?.user) return null;

  return <>{children}</>;
}
