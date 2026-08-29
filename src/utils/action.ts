import type { ActionResult } from '@/types/action';

export async function unwrapAction<T>(resultPromise: Promise<ActionResult<T>>): Promise<T> {
  const result = await resultPromise;
  if ('error' in result) throw new Error(result.error);
  return result.data;
}
