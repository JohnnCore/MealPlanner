import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
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

// import { defineConfig, globalIgnores } from 'eslint/config';
// import nextVitals from 'eslint-config-next/core-web-vitals';
// import nextTs from 'eslint-config-next/typescript';
// import reactPlugin from 'eslint-plugin-react';
// import reactHooksPlugin from 'eslint-plugin-react-hooks';
// import tseslint from '@typescript-eslint/eslint-plugin';
// import tseslintParser from '@typescript-eslint/parser';

// const eslintConfig = defineConfig([
//   ...nextVitals,
//   ...nextTs,
//   // Explicit ignores to replace the deprecated .eslintignore file
//   globalIgnores(['.next/**', 'out/**', 'build/**', 'node_modules/**', 'next-env.d.ts']),
//   // Explicit rule overrides and additions
//   {
//     files: ['**/*.{js,cjs,mjs,ts,cts,mts,jsx,tsx}'],
//     languageOptions: {
//       parser: tseslintParser,
//       parserOptions: {
//         ecmaVersion: 'latest',
//         sourceType: 'module',
//         ecmaFeatures: { jsx: true },
//       },
//     },
//     plugins: {
//       '@typescript-eslint': tseslint,
//       react: reactPlugin,
//       'react-hooks': reactHooksPlugin,
//     },
//     settings: {
//       react: { version: 'detect' },
//     },
//     rules: {
//       'react-hooks/rules-of-hooks': 'error',
//       'react-hooks/exhaustive-deps': 'warn',
//       '@typescript-eslint/no-explicit-any': 'error',
//       'react/react-in-jsx-scope': 'off',
//     },
//   },
// ]);

// export default eslintConfig;
