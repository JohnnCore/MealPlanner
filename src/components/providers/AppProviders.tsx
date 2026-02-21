'use client';

import { SessionProvider } from './SessionProvider';
import { AuthProvider } from './AuthProvider';

/**
 * Root provider tree. Add future global providers (QueryClient, ThemeProvider, etc.) here.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>{children}</AuthProvider>
    </SessionProvider>
  );
}
