import { expect, test, type Page } from '@playwright/test'
import { isPcViewport, openMenuIfCollapsed } from './helpers'

/**
 * Projects の内容は microCMS（`projects`）に依存するため、
 * 件数や文言そのものではなく、構造・属性・振る舞いを検証する。
 */

/**
 * @function openFirstProject
 * @description 一覧の先頭（最新）のプロジェクト詳細を開き、そのタイトルを返す
 * @param {Page} page - 対象ページ
 * @param {string} listPath - 一覧ページのパス
 * @returns {Promise<string>} 開いたプロジェクトのタイトル
 */
const openFirstProject = async (page: Page, listPath = '/projects/'): Promise<string> => {
  await page.goto(listPath)
  const title = (await page.locator('.p-projects__title').first().innerText()).trim()
  await page.locator('.p-projects__link').first().click()
  // 遷移完了前に一覧ページの要素を検証しないよう、詳細ページの URL になるまで待つ
  await page.waitForURL(/\/projects\/[\w-]+\/$/)
  return title
}

test.describe('Projects 一覧', () => {
  test('見出しと、詳細ページへのリンクを持つ項目を表示する', async ({ page }) => {
    await page.goto('/projects/')
    await expect(page.getByRole('heading', { level: 1, name: 'Projects' })).toBeAttached()
    const links = page.locator('.p-projects__link')
    expect(await links.count()).toBeGreaterThan(0)
    for (const href of await links.evaluateAll((els) => els.map((el) => el.getAttribute('href')))) {
      expect(href).toMatch(/^\/projects\/[\w-]+\/$/)
    }
  })

  test('英語版のリンクは /en/ 配下の詳細ページを指す', async ({ page }) => {
    await page.goto('/en/projects/')
    await expect(page.locator('.p-projects__link').first()).toHaveAttribute(
      'href',
      /^\/en\/projects\/[\w-]+\/$/
    )
  })

  test('フッターの Projects は現在地として表示する', async ({ page }) => {
    await page.goto('/projects/')
    await openMenuIfCollapsed(page)
    const nav = page.getByRole('navigation', { name: 'サイト内' })
    await expect(nav.locator('[aria-current="page"]')).toContainText('Projects')
  })

  test('サムネイルは WebP の srcset と寸法を持つ', async ({ page }) => {
    await page.goto('/projects/')
    const thumbnail = page.locator('.p-projects__thumbnail').first()
    await expect(thumbnail).toHaveAttribute('srcset', /fm=webp/)
    await expect(thumbnail).toHaveAttribute('width', /\d+/)
    await expect(thumbnail).toHaveAttribute('height', /\d+/)
  })

  test('PC: サムネイルはホバーした項目のものだけを表示する', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/projects/')
    const cards = page.locator('.p-projects__card')
    const first = cards.nth(0).locator('.p-projects__thumbnail')
    const second = cards.nth(1).locator('.p-projects__thumbnail')
    await expect(first).toHaveCSS('opacity', '0')

    await cards.nth(0).locator('.p-projects__link').hover()
    await expect(first).toHaveCSS('opacity', '1')
    await expect(second).toHaveCSS('opacity', '0')

    await page.mouse.move(0, 0)
    await expect(first).toHaveCSS('opacity', '0')
  })

  test('PC: サムネイルの上端は一覧の上端（1 件目）に揃う', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/projects/')
    await page.locator('.p-projects__link').first().hover()
    const thumbnailBox = await page.locator('.p-projects__thumbnail').first().boundingBox()
    const firstItemBox = await page.locator('.p-projects__item').first().boundingBox()
    expect(Math.abs((thumbnailBox?.y ?? 0) - (firstItemBox?.y ?? 0))).toBeLessThanOrEqual(1)
  })

  test('PC: キーボードでフォーカスした項目のサムネイルも表示する', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/projects/')
    await page.locator('.p-projects__link').first().focus()
    await page.keyboard.press('Tab')
    await page.keyboard.press('Shift+Tab')
    await expect(page.locator('.p-projects__thumbnail').first()).toHaveCSS('opacity', '1')
  })

  test('SP: ページヘッダーを表示し、サムネイルを常時表示する', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await page.goto('/projects/')
    await expect(page.locator('.p-projects__identity--sp')).toContainText('List')
    const thumbnail = page.locator('.p-projects__thumbnail').first()
    await expect(thumbnail).toBeVisible()
    await expect(thumbnail).toHaveCSS('opacity', '1')
    // 1 件目はファーストビューに入るため即時読み込みし、SP 向けに先読みする
    await expect(thumbnail).toHaveAttribute('loading', 'eager')
    await expect(page.locator('link[rel="preload"][as="image"]')).toHaveAttribute(
      'media',
      '(width < 64rem)'
    )
  })

  test('SP: 説明文は写真の幅で折り返す', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await page.goto('/projects/')
    const card = page
      .locator('.p-projects__card')
      .filter({ has: page.locator('.p-projects__description') })
      .first()
    const descriptionBox = await card.locator('.p-projects__description').boundingBox()
    const thumbnailBox = await card.locator('.p-projects__thumbnail').boundingBox()
    expect(descriptionBox?.width ?? Infinity).toBeLessThanOrEqual((thumbnailBox?.width ?? 0) + 1)
  })

  test('SP: 写真をタップすると詳細ページへ移動する', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await page.goto('/projects/')
    await page.locator('.p-projects__thumbnail').first().click()
    await page.waitForURL(/\/projects\/[\w-]+\/$/)
  })
})

test.describe('Project 詳細', () => {
  test('一覧の項目から詳細へ移動し、タイトルを h1 に表示する', async ({ page }) => {
    const title = await openFirstProject(page)
    await expect(page).toHaveURL(/\/projects\/[\w-]+\/$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title)
    await expect(page).toHaveTitle(new RegExp(`^${title} \\|`))
  })

  test('写真は WebP・寸法付きで、1 枚目のみ先読み・即時読み込みにする', async ({ page }) => {
    await openFirstProject(page)
    const images = page.locator('.p-project__image')
    expect(await images.count()).toBeGreaterThan(0)
    await expect(images.first()).toHaveAttribute('srcset', /fm=webp/)
    await expect(images.first()).toHaveAttribute('width', /\d+/)
    await expect(images.first()).toHaveAttribute('height', /\d+/)
    await expect(images.first()).toHaveAttribute('loading', 'eager')
    if ((await images.count()) > 1) {
      await expect(images.nth(1)).toHaveAttribute('loading', 'lazy')
    }
    await expect(page.locator('picture > source[type="image/avif"]').first()).toHaveAttribute(
      'srcset',
      /fm=avif/
    )
    const preload = page.locator('link[rel="preload"][as="image"]')
    await expect(preload).toHaveCount(1)
    await expect(preload).toHaveAttribute('type', 'image/avif')
  })

  test('1 枚目の写真は AVIF で読み込まれ、レイアウト上は <img> が直接の配置対象になる', async ({
    page,
  }) => {
    await openFirstProject(page)
    const image = page.locator('.p-project__image').first()
    await expect(image).toHaveJSProperty('complete', true)
    expect(await image.evaluate((img: HTMLImageElement) => img.currentSrc)).toContain('fm=avif')
    // <picture> は display: contents で箱を作らない（既存の <img> のスタイルをそのまま効かせる）
    expect(await image.evaluate((img) => getComputedStyle(img.parentElement ?? img).display)).toBe(
      'contents'
    )
  })

  test('本文の改行は <br> で表現され、HTML としては解釈されない', async ({ page }) => {
    await openFirstProject(page)
    const html = await page.locator('.p-project__text').innerHTML()
    expect(html).not.toContain('<script')
    expect(await page.locator('.p-project__paragraph br').count()).toBeGreaterThan(0)
  })

  test('CMS のカスタムクラス付きテキストは黒 100% で表示する', async ({ page }) => {
    // カスタムクラスを使っている記事を一覧から探す（CMS の内容に依存するため、無ければスキップ）
    await page.goto('/projects/')
    const hrefs = await page
      .locator('.p-projects__link')
      .evaluateAll((els) => els.map((el) => el.getAttribute('href') ?? ''))
    const findEmphasizedProject = async (): Promise<boolean> => {
      for (const href of hrefs) {
        await page.goto(href)
        if ((await page.locator('.p-project__emphasis').count()) > 0) {
          return true
        }
      }
      return false
    }
    test.skip(!(await findEmphasizedProject()), 'カスタムクラスを使った記事がない')

    // トークンを oklch で定義しているため、ブラウザにより rgb / oklch のどちらかで返る
    const black = /^(rgb\(0, 0, 0\)|oklch\(0 0 0\))$/
    await expect(page.locator('.p-project__emphasis').first()).toHaveCSS('color', black)
    await expect(page.locator('.p-project__text')).not.toHaveCSS('color', black)
  })

  test('フッターの Projects は一覧へ戻るリンクになっている', async ({ page }) => {
    await openFirstProject(page)
    await openMenuIfCollapsed(page)
    await page.getByRole('link', { name: 'Projects' }).click()
    await expect(page).toHaveURL(/\/projects\/$/)
  })

  test('言語切り替えで同じプロジェクトの英語版へ移動する', async ({ page }) => {
    await openFirstProject(page)
    const path = new URL(page.url()).pathname
    await page.getByRole('link', { name: 'en', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/en${path}$`))
  })

  test('PC: プロフィールは固定、概要は氏名の位置から上がってエリア全体が縦中央で固定される', async ({
    page,
  }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await openFirstProject(page)
    const viewportHeight = page.viewportSize()?.height ?? 0
    const caption = page.locator('.p-project__caption')
    const captionY = async (): Promise<number> => (await caption.boundingBox())?.y ?? 0
    const captionCenter = async (): Promise<number> => {
      const box = await caption.boundingBox()
      return (box?.y ?? 0) + (box?.height ?? 0) / 2
    }
    const profileY = async (): Promise<number> =>
      (await page.locator('.p-project__identity--pc').boundingBox())?.y ?? 0
    const imageY = async (): Promise<number> =>
      (await page.locator('.p-project__image').first().boundingBox())?.y ?? 0

    const initial = { caption: await captionY(), profile: await profileY(), image: await imageY() }
    // 初期表示: 概要のタイトルは左カラムの氏名と行の縦中央が揃う
    const centerY = async (selector: string): Promise<number> => {
      const box = await page.locator(selector).boundingBox()
      return (box?.y ?? 0) + (box?.height ?? 0) / 2
    }
    expect(
      Math.abs(
        (await centerY('.p-project__title')) -
          (await centerY('.p-project__identity--pc .p-profile__name'))
      )
    ).toBeLessThanOrEqual(1)

    // 少しスクロール: 概要は写真と同じだけ上がり、プロフィールは動かない
    const step = 40
    await page.evaluate((y) => window.scrollTo(0, y), step)
    await expect.poll(imageY).toBeCloseTo(initial.image - step, 0)
    expect(await captionY()).toBeCloseTo(initial.caption - step, 0)
    expect(await profileY()).toBe(initial.profile)

    // さらにスクロール: 概要エリア全体が画面の縦中央で固定され、写真だけが動く
    for (const scrollY of [viewportHeight, viewportHeight * 2]) {
      await page.evaluate((y) => window.scrollTo(0, y), scrollY)
      await expect.poll(imageY).toBeCloseTo(initial.image - scrollY, 0)
      expect(Math.abs((await captionCenter()) - viewportHeight / 2)).toBeLessThanOrEqual(1)
      expect(await profileY()).toBe(initial.profile)
    }
    await expect(page.locator('.js-site-footer')).toBeInViewport()
  })

  test('PC: 概要の本文はエリア内スクロールで、スクロールバーを表示しない', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await openFirstProject(page)
    const text = page.locator('.p-project__text')
    await expect(text).toHaveCSS('overflow-y', 'auto')
    await expect(text).toHaveCSS('scrollbar-width', 'none')
    // 固定後の本文の下端はフッター（地色の帯）の上端を越えない
    const viewportHeight = page.viewportSize()?.height ?? 0
    await page.evaluate((y) => window.scrollTo(0, y), viewportHeight * 2)
    await expect
      .poll(async () => {
        const box = await page.locator('.p-project__caption').boundingBox()
        return (box?.y ?? 0) + (box?.height ?? 0) / 2
      })
      .toBeCloseTo(viewportHeight / 2, 0)
    const textBox = await text.boundingBox()
    const footerBox = await page.locator('.js-site-footer').boundingBox()
    expect((textBox?.y ?? 0) + (textBox?.height ?? 0)).toBeLessThanOrEqual(footerBox?.y ?? 0)
  })

  test('SP: ページヘッダー「Katsuaki Kobayashi - Project」を表示する', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await openFirstProject(page)
    await expect(page.locator('.p-project__identity--sp')).toContainText('Project')
  })

  test('フッターは画面下端に固定され、スクロールしても表示され続ける', async ({ page }) => {
    await openFirstProject(page)
    const footer = page.locator('.js-site-footer')
    const viewportHeight = page.viewportSize()?.height ?? 0
    const footerBottom = async (): Promise<number> => {
      const box = await footer.boundingBox()
      return Math.round((box?.y ?? 0) + (box?.height ?? 0))
    }

    expect(await footerBottom()).toBe(viewportHeight)
    await page.evaluate((height) => window.scrollBy(0, height), viewportHeight)
    await expect(footer).toBeInViewport()
    expect(await footerBottom()).toBe(viewportHeight)
  })
})
