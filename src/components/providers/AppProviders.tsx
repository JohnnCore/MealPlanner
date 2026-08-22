'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

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

  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname.startsWith(route));

  // Only block protected routes while session hydrates.
  // Public pages (login, register) render immediately.
  if (status === 'loading' && !isPublicRoute) {
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
