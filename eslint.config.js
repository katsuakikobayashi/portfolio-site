import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import astro from 'eslint-plugin-astro'

export default tseslint.config(
  {
    ignores: [
      'dist/',
      '.astro/',
      'node_modules/',
      'coverage/',
      'test-results/',
      'playwright-report/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...astro.configs.recommended,
  {
    rules: {
      // 要件⑧: any 型の全面禁止
      '@typescript-eslint/no-explicit-any': 'error',
      // 要件⑧: デバッグ用出力をビルド前に残さない
      'no-console': 'error',
      // 要件⑩: スコープ最小化（const 優先）
      'prefer-const': 'error',
      'no-var': 'error',
      // 要件⑧: 未使用コードの排除
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.config.{js,mjs,ts}', 'playwright.config.ts', 'vitest.config.ts'],
    rules: {
      'no-undef': 'off',
    },
  }
)
