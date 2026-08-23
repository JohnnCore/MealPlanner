'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

import { AppSidebar } from '@/components/AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

import { QueryProvider } from './QueryProvider';
import { SessionProvider } from './SessionProvider';

/** Routes that must never be blocked by the auth-loading overlay. */
const PUBLIC_ROUTES = ['/login', '/register'];

/**
 * Root provider tree.
 * Order: QueryProvider → SessionProvider → InnerApp
 *
 * QueryProvider is outermost so every hook in the tree can access the
 * same QueryClient (including auth-related queries/mutations).
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SessionProvider>
        <InnerApp>{children}</InnerApp>
        <Toaster richColors />
      </SessionProvider>
    </QueryProvider>
  );
}

function InnerApp({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // NextAuth's `status` also flips to 'loading' for the round trip of a plain
  // useSession().update() call (e.g. a profile save patching name/email into the
  // session) — not just the initial hydration. Gating on `status === 'loading'`
  // alone would unmount the whole app on every such update, discarding any
  // in-flight client state (a form that was just saved, an open dialog). Latch
  // once the first real session value has resolved — set during render (React's
  // sanctioned pattern for deriving state from a prop/value change) so later
  // 'loading' blips from update() don't tear the tree down again.
  const [hasHydrated, setHasHydrated] = useState(false);
  if (!hasHydrated && status !== 'loading') {
    setHasHydrated(true);
  }

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Only block protected routes while session hydrates for the first time.
  // Public pages (login, register) render immediately.
  if (status === 'loading' && !hasHydrated && !isPublicRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return session?.user ? (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  ) : (
    <div className="min-h-screen">{children}</div>
  );
}
