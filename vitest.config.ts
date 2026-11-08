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
      include: ['src/i18n/**/*.ts', 'src/data/**/*.ts', 'src/lib/**/*.ts'],
      // index.ts は astro:env に依存するため単体テスト対象外（E2E で担保）
      exclude: [
        '**/*.test.ts',
        'src/i18n/config.ts',
        'src/lib/microcms/index.ts',
        'src/lib/microcms/types.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 78,
        statements: 80,
      },
    },
  },
})
