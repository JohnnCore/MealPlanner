/**
 * Centralized React Query key factory.
 *
 * Every feature declares its keys here so cache invalidation,
 * prefetching, and optimistic updates stay consistent.
 */
export const queryKeys = {
  /* -- Shopping -- */
  shopping: {
    all: ['shopping'] as const,
    lists: () => [...queryKeys.shopping.all, 'lists'] as const,
    list: (listId: string) => [...queryKeys.shopping.all, 'list', listId] as const,
    categories: () => [...queryKeys.shopping.all, 'categories'] as const,
  },
} as const;
