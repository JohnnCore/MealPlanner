import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Native tsconfig-paths resolution (Vite 6+) — reads tsconfig.json's `paths`
  // directly, no separate plugin needed. This is what next/jest couldn't do
  // reliably, forcing a hand-written moduleNameMapper.
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Tests here cover server-only logic (services/, lib/, server/) — no DOM needed.
    // Switch to 'jsdom' (or override per-file) when component tests are added.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Vitest doesn't clear mock call-history between tests by default the way our
    // prior Jest config's `clearMocks: true` did — without this, `.mock.calls[0]`
    // in a later test silently refers to a call made by an earlier one.
    clearMocks: true,
  },
});
