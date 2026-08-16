'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

import { makeQueryClient } from '@/lib/queryClient';

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * Provides a stable QueryClient instance for the entire client-side tree.
 * A new client is created once per component mount (i.e. once per page load)
 * thanks to `useState`, so it is never accidentally recreated on re-renders.
 *
 * ReactQueryDevtools is included automatically in development builds only.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // `useState` with a factory function ensures the client is created once
  // and survives re-renders without switching to a ref.
  const [queryClient] = useState(makeQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
