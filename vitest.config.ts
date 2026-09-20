import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/i18n/**/*.ts', 'src/data/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/i18n/config.ts'],
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 78,
        statements: 80,
      },
    },
  },
})
