import { expect, test } from '@playwright/test'
import { getContactLineEdges, isPcViewport } from './helpers'

/**
 * About の氏名・本文・写真は microCMS の内容に依存するため、
 * 文言そのものではなく構造（見出し・段落・属性）を検証する。
 */
test.describe('About ページ', () => {
  test('CMS の氏名を h1、本文を段落として表示する', async ({ page }) => {
    await page.goto('/about/')
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()
    expect(await page.locator('.p-about__paragraph').count()).toBeGreaterThan(0)
  })

  test('PC: 和文の氏名は 14px・字間 0.56em で表示する', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/about/')
    const name = page.locator('.p-about__name')
    await expect(name).toHaveCSS('font-size', '14px')
    // 0.56em × 14px = 7.84px
    await expect(name).toHaveCSS('letter-spacing', '7.84px')
  })

  test('PC: 欧文の氏名も 14px で表示する', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/en/about/')
    await expect(page.locator('.p-about__name')).toHaveCSS('font-size', '14px')
  })

  for (const path of ['/about/', '/en/about/']) {
    test(`SP: 氏名は 12px、本文は 10.5px で表示する（${path}）`, async ({ page }) => {
      test.skip(isPcViewport(page), 'SP のみの仕様')
      await page.goto(path)
      await expect(page.locator('.p-about__name')).toHaveCSS('font-size', '12px')
      await expect(page.locator('.p-about__paragraph').first()).toHaveCSS('font-size', '10.5px')
    })
  }

  test('本文の改行は <br> で表現され、HTML としては解釈されない', async ({ page }) => {
    await page.goto('/about/')
    const html = await page.locator('.p-about__article').innerHTML()
    expect(html).not.toContain('<script')
    expect(await page.locator('.p-about__paragraph br').count()).toBeGreaterThan(0)
  })

  test('meta description に本文の先頭段落を使う', async ({ page }) => {
    await page.goto('/en/about/')
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    const firstParagraph = await page.locator('.p-about__paragraph').first().innerText()
    expect(description).toBe(firstParagraph.replace(/\s*\n\s*/g, ' '))
  })

  test('写真は WebP の srcset と寸法を持ち、クレジットを添える', async ({ page }) => {
    await page.goto('/about/')
    const image = page.locator('.p-about__photo-image')
    await expect(image).toHaveAttribute('srcset', /fm=webp/)
    await expect(image).toHaveAttribute('width', /\d+/)
    await expect(image).toHaveAttribute('height', /\d+/)
    await expect(page.locator('.p-about__photo-caption')).not.toBeEmpty()
  })

  test('英語版でも写真を表示する', async ({ page }) => {
    await page.goto('/en/about/')
    await expect(page.locator('.p-about__photo-image')).toHaveCount(1)
  })

  test('PC: 写真は本文にホバーしたときだけ表示される', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/about/')
    const photo = page.locator('.p-about__photo')
    await expect(photo).toHaveCSS('opacity', '0')

    await page.locator('.p-about__article').hover()
    await expect(photo).toHaveCSS('opacity', '1')

    await page.mouse.move(0, 0)
    await expect(photo).toHaveCSS('opacity', '0')
  })

  test('PC: 本文の幅はフッターの Contact〜instagram の 1 行に揃う', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/about/')
    await page.evaluate(() => document.fonts.ready)
    const articleBox = await page.locator('.p-about__article').boundingBox()
    const contact = await getContactLineEdges(page)
    expect(Math.abs((articleBox?.x ?? 0) - contact.left)).toBeLessThanOrEqual(1)
    expect(
      Math.abs((articleBox?.x ?? 0) + (articleBox?.width ?? 0) - contact.right)
    ).toBeLessThanOrEqual(1)
  })

  test('SP: ページヘッダーを表示し、写真は表示しない', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await page.goto('/about/')
    await expect(page.locator('.p-about__identity--sp')).toBeVisible()
    await expect(page.locator('.p-about__identity--sp')).toContainText('About')
    await expect(page.locator('.p-about__photo')).toBeHidden()
  })
})
