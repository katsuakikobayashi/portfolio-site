import { expect, test } from '@playwright/test'
import { isPcViewport } from './helpers'

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

  test('SP: ページヘッダーを表示し、写真は表示しない', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await page.goto('/about/')
    await expect(page.locator('.p-about__identity--sp')).toBeVisible()
    await expect(page.locator('.p-about__identity--sp')).toContainText('About')
    await expect(page.locator('.p-about__photo')).toBeHidden()
  })
})
