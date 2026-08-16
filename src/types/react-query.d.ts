import '@tanstack/react-query';

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: {
      /** Shown as a success toast when set. Omit to stay silent on success. */
      successMessage?: string;
      /** Shown as an error toast. Falls back to the thrown error's message when unset. */
      errorMessage?: string;
    };
  }
}
