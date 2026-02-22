'use client';

import { SessionProvider } from './SessionProvider';
import { AuthProvider } from './AuthProvider';
import { useAuthStore } from '@/stores/authStore';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

/**
 * Root provider tree. Add future global providers (QueryClient, ThemeProvider, etc.) here.
 * This component also renders the app frame (sidebar + content) when a user is authenticated.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  // Always mount SessionProvider + AuthProvider so the auth effect can run
  // and update the Zustand store. The inner renderer decides whether to
  // show the sidebar or a loading state based on the store.
  return (
    <SessionProvider>
      <AuthProvider>
        <InnerApp>{children}</InnerApp>
      </AuthProvider>
    </SessionProvider>
  );
}

function InnerApp({ children }: { children: React.ReactNode }) {
  const user = useAuthStore(state => state.user);
  const isLoading = useAuthStore(state => state.isLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      ) : (
        <>{children}</>
      )}
    </>
  );
}
