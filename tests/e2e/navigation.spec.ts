import { expect, test } from '@playwright/test'

test.describe('言語切り替え', () => {
  test('日本語 TOP では jp が現在地として非リンク表示になる', async ({ page }) => {
    await page.goto('/')
    const nav = page.getByRole('navigation', { name: '言語切り替え' })
    await expect(nav.getByText('jp', { exact: true })).toHaveAttribute('aria-current', 'true')
    await expect(nav.getByRole('link', { name: 'en' })).toHaveAttribute('href', '/en/')
  })

  test('en へ切り替えると英語 TOP に遷移する', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: '言語切り替え' }).getByRole('link').click()
    await expect(page).toHaveURL(/\/en\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('英語 TOP から jp へ戻れる', async ({ page }) => {
    await page.goto('/en/')
    await page.getByRole('navigation', { name: 'Language' }).getByRole('link').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja')
  })
})

test.describe('ページ遷移', () => {
  test('TOP から About へ遷移できる', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/about\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('小林　克彰')
  })

  test('英語 TOP から英語 About へ遷移できる', async ({ page }) => {
    await page.goto('/en/')
    await page.getByRole('link', { name: 'About' }).click()
    await expect(page).toHaveURL(/\/en\/about\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Katsuaki Kobayashi')
  })

  test('About の言語切り替えは同一ページの別言語版を指す', async ({ page }) => {
    await page.goto('/about/')
    await expect(
      page.getByRole('navigation', { name: '言語切り替え' }).getByRole('link')
    ).toHaveAttribute('href', '/en/about/')
  })

  test('About から Home リンクで TOP に戻れる', async ({ page }) => {
    await page.goto('/about/')
    await page.getByRole('link', { name: 'Home' }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('About のパンくずは現在地を示す', async ({ page }) => {
    await page.goto('/about/')
    const current = page.getByText('About', { exact: true }).and(page.locator('[aria-current]'))
    await expect(current).toHaveAttribute('aria-current', 'page')
  })

  test('About 本文は指示どおりの箇所で改行される', async ({ page }) => {
    await page.goto('/about/')
    const paragraphs = page.locator('.p-about__grid:visible .p-about__paragraph')
    await expect(paragraphs).toHaveCount(2)
    // 1 段落目: 3 行 -> <br> 2 個、2 段落目: 2 行 -> <br> 1 個
    await expect(paragraphs.nth(0).locator('br')).toHaveCount(2)
    await expect(paragraphs.nth(1).locator('br')).toHaveCount(1)
  })
})
