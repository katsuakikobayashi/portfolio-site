import { expect, test } from '@playwright/test'
import { getLinkHrefAtPoint, isPcViewport, openMenuIfCollapsed } from './helpers'

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

test.describe('SP タップ領域', () => {
  /*
   * 文字の上下端からタップ位置までの距離（px）。
   * タップ領域は 44px 四方まで広げており、文字（約 14px）の上下に約 15px ずつ余裕があるため、
   * その内側で「文字から外れているが領域内」の位置を指す
   */
  const OUTSIDE_TEXT_OFFSET = 10
  /*
   * メールと instagram の間隔（9px）の半分より内側の距離（px）。
   * 間隔の中央が両リンクの境目になるため、それぞれの側に収まる位置を指す
   */
  const CONTACT_GAP_OFFSET = 3

  test.beforeEach(async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
  })

  test('言語切り替えは文字の少し上をタップしても切り替わる', async ({ page }) => {
    await page.goto('/')
    const box = await page
      .getByRole('navigation', { name: '言語切り替え' })
      .getByRole('link')
      .boundingBox()
    expect(box).not.toBeNull()
    if (!box) {
      return
    }

    await page.touchscreen.tap(box.x + box.width / 2, box.y - OUTSIDE_TEXT_OFFSET)
    await expect(page).toHaveURL(/\/en\/$/)
  })

  test('フッターメニューのページリンクは文字の少し上下をタップしても反応する', async ({ page }) => {
    await page.goto('/')
    await openMenuIfCollapsed(page)
    const link = page.getByRole('navigation', { name: 'サイト内' }).getByRole('link', {
      name: 'Projects',
    })
    const box = await link.boundingBox()
    expect(box).not.toBeNull()
    if (!box) {
      return
    }

    const href = await link.getAttribute('href')
    const centerX = box.x + box.width / 2
    expect(await getLinkHrefAtPoint(page, centerX, box.y - OUTSIDE_TEXT_OFFSET)).toBe(href)
    expect(await getLinkHrefAtPoint(page, centerX, box.y + box.height + OUTSIDE_TEXT_OFFSET)).toBe(
      href
    )

    await page.touchscreen.tap(centerX, box.y - OUTSIDE_TEXT_OFFSET)
    await expect(page).toHaveURL(/\/projects\/$/)
  })

  test('メールと instagram は隣り合うリンクの領域と重ならない', async ({ page }) => {
    await page.goto('/')
    await openMenuIfCollapsed(page)
    const email = page.locator('.js-email-link')
    const instagram = page.getByRole('link', { name: 'instagram' })
    const [emailBox, instagramBox] = await Promise.all([
      email.boundingBox(),
      instagram.boundingBox(),
    ])
    expect(emailBox).not.toBeNull()
    expect(instagramBox).not.toBeNull()
    if (!emailBox || !instagramBox) {
      return
    }

    const centerX = instagramBox.x + instagramBox.width / 2
    expect(
      await getLinkHrefAtPoint(page, centerX, emailBox.y + emailBox.height + CONTACT_GAP_OFFSET)
    ).toBe(await email.getAttribute('href'))
    expect(await getLinkHrefAtPoint(page, centerX, instagramBox.y - CONTACT_GAP_OFFSET)).toBe(
      await instagram.getAttribute('href')
    )
  })
})
