/**
 * Shared return shape for Server Actions, mirroring registerAction's convention.
 * useMutation's onError only fires on a thrown error, so React Query mutationFns
 * unwrap this with unwrapAction() rather than checking `result.error` themselves.
 */
export type ActionResult<T> = { success: true; data: T } | { error: string };
