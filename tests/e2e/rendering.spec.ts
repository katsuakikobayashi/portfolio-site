import { expect, test } from '@playwright/test'

test.describe('表示品質', () => {
  test('ページ読み込みが 3 秒以内に完了する', async ({ page }) => {
    const start = Date.now()
    await page.goto('/', { waitUntil: 'load' })
    expect(Date.now() - start).toBeLessThan(3000)
  })

  test('レイアウトシフトが発生しない', async ({ page }) => {
    await page.goto('/')
    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let value = 0
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
              if (!shift.hadRecentInput) value += shift.value
            }
          })
          observer.observe({ type: 'layout-shift', buffered: true })
          setTimeout(() => {
            observer.disconnect()
            resolve(value)
          }, 1500)
        })
    )
    expect(cls).toBeLessThan(0.1)
  })

  test('横スクロールが発生しない', async ({ page }) => {
    await page.goto('/')
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(overflows).toBe(false)
  })

  test('フッターが常にビューポート下端に配置される', async ({ page }) => {
    await page.goto('/')
    const footer = page.locator('.p-site-footer')
    await expect(footer).toBeVisible()
    const box = await footer.boundingBox()
    const viewport = page.viewportSize()
    expect(box).not.toBeNull()
    expect(viewport).not.toBeNull()
    if (box && viewport) {
      expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
    }
  })

  test('robots.txt が sitemap を参照している', async ({ request }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain('sitemap-index.xml')
  })

  test('llms.txt がページ一覧を返す', async ({ request }) => {
    const response = await request.get('/llms.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')
    const body = await response.text()
    expect(body).toContain('# Katsuaki Kobayashi')
    expect(body).toContain('/about/')
    expect(body).toContain('/en/about/')
  })
})
