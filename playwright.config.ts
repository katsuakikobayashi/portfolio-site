import { defineConfig, devices } from '@playwright/test'

const BASE_URL = process.env['BASE_URL'] ?? 'http://localhost:4321'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  ...(process.env['CI'] ? { workers: 1 } : {}),
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    // `astro preview` は非 TTY 環境だとバックグラウンド常駐に切り替わり、
    // Playwright からはプロセスが即終了したように見える。--ignore-lock を
    // 付けた preview:ci はフォアグラウンドで動き続けるためテストから扱える。
    command: 'npm run build && npm run preview:ci',
    url: BASE_URL,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1024 } },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 15 Pro'] },
    },
  ],
})
