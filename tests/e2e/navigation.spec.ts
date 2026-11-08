import { expect, test } from '@playwright/test'
import { isPcViewport, openMenuIfCollapsed } from './helpers'

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

  test('About の言語切り替えは同一ページの別言語版を指す', async ({ page }) => {
    await page.goto('/about/')
    await expect(
      page.getByRole('navigation', { name: '言語切り替え' }).getByRole('link')
    ).toHaveAttribute('href', '/en/about/')
  })
})

test.describe('ページ遷移', () => {
  test('TOP から About へ遷移できる', async ({ page }) => {
    await page.goto('/')
    await openMenuIfCollapsed(page)
    await page
      .getByRole('navigation', { name: 'サイト内' })
      .getByRole('link', { name: 'About' })
      .click()
    await expect(page).toHaveURL(/\/about\/$/)
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty()
  })

  test('英語 TOP から英語 About へ遷移できる', async ({ page }) => {
    await page.goto('/en/')
    await openMenuIfCollapsed(page)
    await page
      .getByRole('navigation', { name: 'Site' })
      .getByRole('link', { name: 'About' })
      .click()
    await expect(page).toHaveURL(/\/en\/about\/$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('About ではフッターの About が現在地として非リンク表示になる', async ({ page }) => {
    await page.goto('/about/')
    await openMenuIfCollapsed(page)
    const nav = page.getByRole('navigation', { name: 'サイト内' })
    await expect(nav.locator('[aria-current="page"]')).toContainText('About')
    await expect(nav.getByRole('link', { name: 'About' })).toHaveCount(0)
  })

  test('About から氏名のリンクで TOP に戻れる', async ({ page }) => {
    await page.goto('/about/')
    await page.getByRole('link', { name: 'Katsuaki Kobayashi' }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('Projects へのリンクから一覧ページへ移動でき、インデックス対象になっている', async ({
    page,
  }) => {
    await page.goto('/')
    await openMenuIfCollapsed(page)
    await page.getByRole('link', { name: 'Projects' }).click()
    await expect(page).toHaveURL(/\/projects\/$/)
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0)
  })
})

test.describe('SP メニュー', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await page.goto('/')
  })

  test('＋ボタンでメニューを開閉できる', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'メニュー' })
    const nav = page.getByRole('navigation', { name: 'サイト内' })

    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(nav).toBeHidden()

    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(nav).toBeVisible()

    await toggle.click()
    await expect(nav).toBeHidden()
  })

  test('Escape キーでメニューを閉じ、ボタンにフォーカスを戻す', async ({ page }) => {
    const toggle = page.getByRole('button', { name: 'メニュー' })
    await toggle.click()
    await page.getByRole('link', { name: 'Projects' }).focus()
    await page.keyboard.press('Escape')
    await expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await expect(toggle).toBeFocused()
  })
})

test.describe('PC フッターナビ', () => {
  test('メニューボタンを出さず、ナビを常時表示する', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'メニュー' })).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'サイト内' })).toBeVisible()
  })
})
