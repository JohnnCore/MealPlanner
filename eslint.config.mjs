import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import vitestPlugin from '@vitest/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': 'warn',
      'simple-import-sort/exports': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'warn',
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always'],
      // 'multi-line', not 'all' — this codebase's dominant style is single-line guard
      // clauses (`if (!list) return { error: '...' };`), which 'all' would force braces
      // onto everywhere (78+ instances). 'multi-line' still requires braces once a
      // block body wraps to more than one line, which is where missing braces get risky.
      curly: ['warn', 'multi-line'],
    },
  },
  // Full jsx-a11y recommended set — core-web-vitals only bundles a handful of a11y
  // rules (alt-text, aria-*). This adds the rest (anchor-is-valid, label-has-associated-control,
  // click-events-have-key-events, etc.) without removing what's already there.
  // Rules only, not the config's own `plugins` map — core-web-vitals already registers
  // the `jsx-a11y` plugin key, and flat config errors on redefining a plugin name.
  // Excludes components/ui/** — see the JSX-quality block below for why.
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    rules: jsxA11y.flatConfigs.recommended.rules,
  },
  // JSX/component-quality rules on top of eslint-config-next's own react rules.
  // No need to re-import/re-register eslint-plugin-react — core-web-vitals already
  // registers it under the `react` key, these just add more rules to that namespace.
  // Excludes components/ui/** — those are shadcn-generated (never hand-edited per
  // convention, see copilot-instructions.md §4.2) and don't follow these stylistic
  // rules upstream; flagging them would just be permanent, unfixable noise.
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/components/ui/**'],
    rules: {
      'react/self-closing-comp': 'warn',
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      'react/no-danger': 'error',
      'react/no-unused-prop-types': 'error',
      'react/no-typos': 'warn',
      'react/destructuring-assignment': ['error', 'always', { destructureInSignature: 'always' }],
      'react/button-has-type': 'error',
      'react/jsx-pascal-case': 'error',
      'react/jsx-no-target-blank': 'error',
      'react/jsx-no-script-url': 'error',
      'react/jsx-fragments': 'error',
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary'] }],
      'react/jsx-no-useless-fragment': 'warn',
      'react/jsx-key': [
        'error',
        { checkFragmentShorthand: true, checkKeyMustBeforeSpread: true, warnOnDuplicates: true },
      ],
      'react/jsx-sort-props': [
        'warn',
        { callbacksLast: true, shorthandFirst: true, reservedFirst: true },
      ],
      // 'function-declaration', not 'arrow-function' — every component in this codebase
      // (including every Next.js page/layout special file) is `export function X()` /
      // `export default function X()`. Enforcing arrow-function would fight the existing
      // convention on every file rather than lock in what's actually used.
      'react/function-component-definition': [
        'warn',
        { namedComponents: 'function-declaration', unnamedComponents: 'arrow-function' },
      ],
    },
  },
  // Type-aware linting, scoped to .ts/.tsx only (needed for no-floating-promises /
  // no-misused-promises, which require real type info). Forces the parser
  // explicitly since eslint-config-next's own parser setup doesn't enable
  // projectService, and linting the .ts/.tsx block twice is harmless.
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'warn',
      // attributes: false — passing an async handler to a JSX prop (onClick={async () => ...},
      // onSubmit={handleSubmit(onSubmit)} from react-hook-form) is normal, idiomatic React;
      // the DOM/React event system doesn't care about the returned promise. Keep the rule
      // active for the genuinely risky cases (promise used where a boolean is expected, etc.)
      '@typescript-eslint/no-misused-promises': [
        'warn',
        { checksVoidReturn: { attributes: false } },
      ],
    },
  },
  // Vitest-specific correctness rules (no-identical-title, valid-expect,
  // no-disabled-tests, etc.), scoped to test files only. No globals injection needed —
  // test files import describe/it/expect/vi from 'vitest' explicitly (see tests/).
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    ...vitestPlugin.configs.recommended,
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
