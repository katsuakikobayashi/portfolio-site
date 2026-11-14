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

  test('PC: Contact〜instagram のブロックは写真の左右中央に揃う', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    const contactBox = await page.locator('.p-site-footer__contact').boundingBox()
    const slideshowBox = await page.locator('.p-slideshow').boundingBox()
    const centerX = (box: typeof contactBox): number => (box?.x ?? 0) + (box?.width ?? 0) / 2
    expect(Math.abs(centerX(contactBox) - centerX(slideshowBox))).toBeLessThanOrEqual(1)
  })

  test('SP: 言語切り替えは 11.5px で表示する', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await expect(page.locator('.p-site-footer__lang')).toHaveCSS('font-size', '11.5px')
  })

  test('SP: メニューの Projects・About・Contact は 16px の間隔で並ぶ', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await openMenuIfCollapsed(page)
    const labels = page.locator('.p-site-footer__label')
    const projectsBox = await labels.nth(0).boundingBox()
    const aboutBox = await labels.nth(1).boundingBox()
    const contactBox = await page.locator('.p-site-footer__contact-heading').boundingBox()
    const rightOf = (box: typeof projectsBox): number => (box?.x ?? 0) + (box?.width ?? 0)
    const projectsToAbout = (aboutBox?.x ?? 0) - rightOf(projectsBox)
    const aboutToContact = (contactBox?.x ?? 0) - rightOf(aboutBox)
    expect(projectsToAbout).toBeCloseTo(16, 0)
    expect(aboutToContact).toBeCloseTo(16, 0)
  })

  test('SP: 肩書きは 11.5px、分野は 10.5px で表示する', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await expect(page.locator('.p-profile__role')).toHaveCSS('font-size', '11.5px')
    await expect(page.locator('.p-profile__disciplines')).toHaveCSS('font-size', '10.5px')
  })

  test('SP: フッターのナビ・コピーライトは 11px で表示する', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await openMenuIfCollapsed(page)
    await expect(page.locator('.p-site-footer__page').first()).toHaveCSS('font-size', '11px')
    await expect(page.locator('.p-site-footer__contact-heading')).toHaveCSS('font-size', '11px')
    await expect(page.locator('.p-site-footer__copyright')).toHaveCSS('font-size', '11px')
  })

  test('SP: メニューのメールと instagram の間隔は 12px', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await openMenuIfCollapsed(page)
    const items = page.locator('.p-site-footer__contact-item')
    const emailBox = await items.nth(0).boundingBox()
    const instagramBox = await items.nth(1).boundingBox()
    const gap = (instagramBox?.y ?? 0) - (emailBox?.y ?? 0) - (emailBox?.height ?? 0)
    expect(gap).toBeCloseTo(12, 0)
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

  test('JavaScript は低優先度で取得し、クリティカルリクエストチェーンに含めない', async ({
    page,
  }) => {
    // integrations/script-priority.ts がビルド後に付与する
    const priorities = await page
      .locator('script[type="module"][src]')
      .evaluateAll((scripts) => scripts.map((script) => script.getAttribute('fetchpriority')))
    expect(priorities.length).toBeGreaterThan(0)
    expect(priorities.every((priority) => priority === 'low')).toBe(true)
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
    // <picture> で最優先される AVIF と一致させる
    await expect(preload).toHaveAttribute('type', 'image/avif')
    await expect(preload).toHaveAttribute('imagesrcset', /fm=avif/)
  })

  test('画像は AVIF を優先し、WebP をフォールバックにする', async ({ page }) => {
    await page.goto('/')
    const source = page.locator('.p-slideshow__item picture > source').first()
    await expect(source).toHaveAttribute('type', 'image/avif')
    await expect(source).toHaveAttribute('srcset', /fm=avif/)
    await expect(source).toHaveAttribute('sizes', /.+/)
  })

  test('画像は WebP・幅別画質の srcset と寸法を持つ', async ({ page }) => {
    await page.goto('/')
    const image = page.locator('.p-slideshow__image').first()
    await expect(image).toHaveAttribute('width', /\d+/)
    await expect(image).toHaveAttribute('height', /\d+/)
    const srcset = (await image.getAttribute('srcset')) ?? ''
    expect(srcset).toContain('fm=webp')
    // 候補幅が表示幅の 1x 付近なら高画質、2x 付近なら画質を下げる
    expect(srcset).toMatch(/w=\d+&q=80 \d+w/)
    expect(srcset).toMatch(/w=\d+&q=60 \d+w/)
  })

  test('PC では表示され、1 枚目が表示中になる', async ({ page }) => {
    test.skip(!isPcViewport(page), 'スライドショーは PC のみ表示')
    await page.goto('/')
    await expect(page.locator('.p-slideshow')).toBeVisible()
    await expect(page.locator('.p-slideshow__item.is-active')).toHaveCount(1)
    await expect(page.locator('.p-slideshow__item').first()).toHaveClass(/is-active/)
  })

  test('各スライドはプロジェクト詳細へのリンクで、表示中以外は操作できない', async ({ page }) => {
    await page.goto('/')
    const items = page.locator('.p-slideshow__item')
    await expect(items.first().locator('.p-slideshow__link')).toHaveAttribute(
      'href',
      /^\/projects\/[\w-]+\/$/
    )
    await expect(items.first()).not.toHaveAttribute('inert')
    if ((await items.count()) > 1) {
      await expect(items.nth(1)).toHaveAttribute('inert', '')
    }
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
