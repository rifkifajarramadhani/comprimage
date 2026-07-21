//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
    },
  },
  {
    // public/ holds raw browser assets; scripts/ holds Node build tooling —
    // neither belongs to the app's TS project.
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      'public/**',
      'scripts/**',
    ],
  },
]
