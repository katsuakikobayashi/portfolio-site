import { expect, test } from '@playwright/test'
import { isPcViewport, openMenuIfCollapsed } from './helpers'

test.describe('TOP ページ', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('デザインどおりのプロフィールが表示される', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Katsuaki Kobayashi')
    await expect(page.getByRole('heading', { name: 'Designer' })).toBeVisible()
    await expect(page.getByText('Product / Select / Graphic / Photography ...')).toBeVisible()
  })

  test('Contact のリンクが正しい宛先を指す', async ({ page }) => {
    await openMenuIfCollapsed(page)
    await expect(page.getByRole('heading', { name: 'Contact' })).toBeVisible()
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

    await openMenuIfCollapsed(page)
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

  test('JavaScript はすべて同一オリジンの外部ファイルとして配信される', async ({ page }) => {
    // CSP は script-src 'self' のみを許可している（netlify.toml）。
    // インラインや外部オリジンのスクリプトが混入していないことを検証する。
    const sources = await page
      .locator('script[src]')
      .evaluateAll((scripts) => scripts.map((script) => script.getAttribute('src') ?? ''))
    expect(sources.length).toBeGreaterThan(0)
    for (const src of sources) {
      expect(src).toMatch(/^\/_astro\/.+\.js$/)
    }
  })

  test('構造化データ（Person）が出力される', async ({ page }) => {
    const jsonLd = await page.locator('script[type="application/ld+json"]').textContent()
    const data = JSON.parse(jsonLd ?? '{}')
    expect(data['@type']).toBe('Person')
    expect(data.name).toBe('Katsuaki Kobayashi')
    expect(data.email).toBe('mailto:info@katsuakikobayashi.com')
    expect(data.knowsAbout).toEqual(['Product', 'Select', 'Graphic', 'Photography'])
  })
})

test.describe('TOP スライドショー', () => {
  test('1 枚目のスライド画像を PC のみ preload する', async ({ page }) => {
    await page.goto('/')
    const preload = page.locator('link[rel="preload"][as="image"]')
    await expect(preload).toHaveCount(1)
    await expect(preload).toHaveAttribute('media', '(width >= 64rem)')
    await expect(preload).toHaveAttribute('imagesrcset', /fm=webp/)
  })

  test('画像は WebP・DPR 別画質の srcset と寸法を持つ', async ({ page }) => {
    await page.goto('/')
    const image = page.locator('.p-slideshow__image').first()
    await expect(image).toHaveAttribute('width', /\d+/)
    await expect(image).toHaveAttribute('height', /\d+/)
    const srcset = (await image.getAttribute('srcset')) ?? ''
    expect(srcset).toContain('fm=webp')
    expect(srcset).toMatch(/dpr=1&q=80 \d+w/)
    expect(srcset).toMatch(/dpr=2&q=60 \d+w/)
  })

  test('PC では表示され、1 枚目が表示中になる', async ({ page }) => {
    test.skip(!isPcViewport(page), 'スライドショーは PC のみ表示')
    await page.goto('/')
    await expect(page.locator('.p-slideshow')).toBeVisible()
    await expect(page.locator('.p-slideshow__item.is-active')).toHaveCount(1)
    await expect(page.locator('.p-slideshow__item').first()).toHaveClass(/is-active/)
  })

  test('SP では表示せず、写真もダウンロードしない', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    const imageRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('images.microcms-assets.io')) {
        imageRequests.push(request.url())
      }
    })
    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.locator('.p-slideshow')).toBeHidden()
    expect(imageRequests).toEqual([])
  })
})
