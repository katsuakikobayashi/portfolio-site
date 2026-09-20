import { expect, test } from '@playwright/test'

test.describe('TOP ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('原稿どおりの文言が表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Katsuaki Kobayashi')
    await expect(page.getByRole('heading', { name: 'Designer' })).toBeVisible()
    await expect(page.getByText('Product / Graphic / Photography')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible()
  })

  test('Contact のリンクが正しい宛先を指す', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'info@katsuakikobayashi.com' })).toHaveAttribute(
      'href',
      'mailto:info@katsuakikobayashi.com'
    )
    const instagram = page.getByRole('link', { name: 'instagram' })
    await expect(instagram).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('メールリンクをクリックするとクリップボードにコピーされ、mailto には遷移しない', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'WebKit は headless での Clipboard API 権限付与に未対応')
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])

    await page.getByRole('link', { name: 'info@katsuakikobayashi.com' }).click()

    await expect(page).toHaveURL('/')
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboardText).toBe('info@katsuakikobayashi.com')
    await expect(page.locator('[data-email-status]')).toBeVisible()
  })

  test('html の lang 属性が ja である', async ({ page }) => {
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  })

  test('canonical と hreflang が出力される', async ({ page }) => {
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
    await expect(page.locator('link[rel="alternate"][hreflang="ja-JP"]')).toHaveCount(1)
    await expect(page.locator('link[rel="alternate"][hreflang="en-US"]')).toHaveCount(1)
  })

  test('OGP 画像が指定されている', async ({ page }) => {
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /\/ogp\.png$/
    )
  })

  test('コンソールにエラー・警告が出ない', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        messages.push(`${message.type()}: ${message.text()}`)
      }
    })
    page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`))

    await page.reload({ waitUntil: 'networkidle' })
    expect(messages).toEqual([])
  })

  test('配信する JavaScript はメールコピー用の 1 ファイルのみで、同一オリジンから読み込まれる', async ({
    page,
  }) => {
    // CSP は script-src 'self' のみを許可している（netlify.toml）。
    // 外部スクリプトが増えていないこと・同一オリジン配信であることを検証する。
    const scripts = page.locator('script[src]')
    await expect(scripts).toHaveCount(1)
    await expect(scripts.first()).toHaveAttribute('src', /^\/_astro\/.+\.js$/)
  })

  test('構造化データ（Person）が出力される', async ({ page }) => {
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent()
    const data = JSON.parse(jsonLd ?? '{}')
    expect(data['@type']).toBe('Person')
    expect(data.name).toBe('Katsuaki Kobayashi')
    expect(data.email).toBe('mailto:info@katsuakikobayashi.com')
  })
})
