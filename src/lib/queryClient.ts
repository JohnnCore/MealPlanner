import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const FIVE_MINUTES = 1000 * 60 * 5;
const TEN_MINUTES = 1000 * 60 * 10;

export function makeQueryClient() {
  return new QueryClient({
    /**
     * Global success/error toasts for every mutation, driven by each
     * useMutation's `meta` (see types/react-query.d.ts for the shape).
     * A mutation without `meta.successMessage` stays silent on success —
     * used for high-frequency, low-stakes updates (e.g. toggling a checkbox)
     * where a toast would just be noise. Errors always surface.
     */
    mutationCache: new MutationCache({
      onSuccess: (_data, _variables, _context, mutation) => {
        if (mutation.meta?.successMessage) {
          toast.success(mutation.meta.successMessage);
        }
      },
      onError: (error, _variables, _context, mutation) => {
        toast.error(mutation.meta?.errorMessage ?? error.message ?? 'Something went wrong');
      },
    }),
    defaultOptions: {
      queries: {
        /**
         * Data is considered fresh for 5 minutes.
         * During this window no background refetch is triggered.
         */
        staleTime: FIVE_MINUTES,
        /**
         * Keep unused query data in cache for 10 minutes before garbage-collecting.
         */
        gcTime: TEN_MINUTES,
        /**
         * Retry failed requests once before surfacing the error.
         */
        retry: 1,
        /**
         * Do not refetch when the window regains focus in production.
         * Override per-query when live data is required.
         */
        refetchOnWindowFocus: false,
      },
      mutations: {
        /**
         * Do not retry failed mutations automatically.
         */
        retry: false,
      },
    },
  });
}
