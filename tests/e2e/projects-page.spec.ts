import { expect, test, type Page } from '@playwright/test'
import {
  getContactLineEdges,
  getLinkHrefAtPoint,
  isPcViewport,
  openMenuIfCollapsed,
} from './helpers'

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
/**
 * @function expectHeaderLinksToTop
 * @description SP のページヘッダーの氏名をタップした位置で、TOP へのリンクが反応することを検証する
 *              （要素が手前の別要素に覆われていないかを、座標の最前面の要素で確かめる）
 * @param {Page} page - 対象ページ
 * @param {string} topPath - 期待する TOP のパス
 * @returns {Promise<void>}
 */
const expectHeaderLinksToTop = async (page: Page, topPath = '/'): Promise<void> => {
  const box = await page.locator('.p-page-header__home').boundingBox()
  const href = await getLinkHrefAtPoint(
    page,
    (box?.x ?? 0) + (box?.width ?? 0) / 2,
    (box?.y ?? 0) + (box?.height ?? 0) / 2
  )
  expect(href).toBe(topPath)
}

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

  test('斜体の年・説明は 10px で表示する', async ({ page }) => {
    await page.goto('/projects/')
    await expect(page.locator('.p-projects__year').first()).toHaveCSS('font-size', '10px')
    await expect(page.locator('.p-projects__description').first()).toHaveCSS('font-size', '10px')
  })

  test('説明文の字間は Project 詳細の概要の本文と同じ', async ({ page }) => {
    await page.goto('/projects/')
    const descriptionSpacing = await page
      .locator('.p-projects__description')
      .first()
      .evaluate((element) => getComputedStyle(element).letterSpacing)
    await openFirstProject(page)
    await expect(page.locator('.p-project__text')).toHaveCSS('letter-spacing', descriptionSpacing)
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

  test('PC: サムネイルは画面の高さの縦中央に表示する', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/projects/')
    await page.locator('.p-projects__link').first().hover()
    const thumbnailBox = await page.locator('.p-projects__thumbnail').first().boundingBox()
    const viewportHeight = page.viewportSize()?.height ?? 0
    const thumbnailCenterY = (thumbnailBox?.y ?? 0) + (thumbnailBox?.height ?? 0) / 2
    expect(Math.abs(thumbnailCenterY - viewportHeight / 2)).toBeLessThanOrEqual(1)
  })

  test('PC: ホバー時は文字だけを薄くし、サムネイルは薄くしない', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/projects/')
    const card = page.locator('.p-projects__card').first()
    await card.locator('.p-projects__link').hover()
    await expect(card.locator('.p-projects__title')).toHaveCSS('opacity', '0.5')
    await expect(card.locator('.p-projects__thumbnail')).toHaveCSS('opacity', '1')
  })

  test('PC: スクロールし切ると最後の項目が画面の縦中央に来て、プロフィールは動かない', async ({
    page,
  }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    // 低い画面でも、固定フッターに隠れた最後の項目までスクロールで見られることを確認する
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/projects/')
    const profile = page.locator('.p-projects__identity--pc')
    const profileY = (await profile.boundingBox())?.y ?? 0

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    const lastItemBox = await page.locator('.p-projects__item').last().boundingBox()
    const footerBox = await page.locator('.js-site-footer').boundingBox()
    const viewportHeight = page.viewportSize()?.height ?? 0
    // 最後の項目の下端が画面の縦中央に揃い、フッターより上に出る
    expect(
      Math.abs((lastItemBox?.y ?? 0) + (lastItemBox?.height ?? 0) - viewportHeight / 2)
    ).toBeLessThanOrEqual(1)
    expect((lastItemBox?.y ?? 0) + (lastItemBox?.height ?? 0)).toBeLessThan(footerBox?.y ?? 0)
    await expect.poll(async () => (await profile.boundingBox())?.y ?? 0).toBeCloseTo(profileY, 0)
  })

  test('PC: 一覧の幅はフッターの Contact〜instagram の 1 行に揃う', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/projects/')
    await page.evaluate(() => document.fonts.ready)
    const listBox = await page.locator('.p-projects__list').boundingBox()
    const contact = await getContactLineEdges(page)
    expect(Math.abs((listBox?.x ?? 0) - contact.left)).toBeLessThanOrEqual(1)
    expect(Math.abs((listBox?.x ?? 0) + (listBox?.width ?? 0) - contact.right)).toBeLessThanOrEqual(
      1
    )
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

  test('SP: ページヘッダーの氏名は TOP へのリンクとして押せる', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await page.goto('/projects/')
    await expectHeaderLinksToTop(page)
  })

  test('PC: 説明文は項目全体の幅の 5 分の 4 で折り返す', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await page.goto('/projects/')
    const card = page
      .locator('.p-projects__card')
      .filter({ has: page.locator('.p-projects__description') })
      .first()
    const descriptionBox = await card.locator('.p-projects__description').boundingBox()
    const linkBox = await card.locator('.p-projects__link').boundingBox()
    expect(
      Math.abs((descriptionBox?.width ?? 0) - (linkBox?.width ?? 0) * 0.8)
    ).toBeLessThanOrEqual(1)
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
    expect(Math.abs((descriptionBox?.width ?? 0) - (thumbnailBox?.width ?? 0))).toBeLessThanOrEqual(
      1
    )
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

  test('概要の本文は 10px で表示する', async ({ page }) => {
    await openFirstProject(page)
    await expect(page.locator('.p-project__text')).toHaveCSS('font-size', '10px')
  })

  test('フッターの Projects は一覧へ戻るリンクになっている', async ({ page }) => {
    await openFirstProject(page)
    await openMenuIfCollapsed(page)
    await page.getByRole('link', { name: 'Projects' }).click()
    await expect(page).toHaveURL(/\/projects\/$/)
  })

  test('フッターの Projects は取り消し線と左矢印で表示する', async ({ page }) => {
    await openFirstProject(page)
    await openMenuIfCollapsed(page)
    const link = page.getByRole('link', { name: 'Projects' })
    await expect(link.locator('.p-site-footer__label')).toHaveCSS(
      'text-decoration-line',
      'line-through'
    )
    await expect(link.locator('.p-site-footer__arrow')).toHaveText('←')
  })

  test('PC: フッターの Contact〜instagram のブロックは写真の左右中央に揃う', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await openFirstProject(page)
    const contactBox = await page.locator('.p-site-footer__contact').boundingBox()
    const imageBox = await page.locator('.p-project__image').first().boundingBox()
    const centerX = (box: typeof contactBox): number => (box?.x ?? 0) + (box?.width ?? 0) / 2
    expect(Math.abs(centerX(contactBox) - centerX(imageBox))).toBeLessThanOrEqual(1)
  })

  test('PC: 1 枚目の写真は画面の縦中央から始まる', async ({ page }) => {
    test.skip(!isPcViewport(page), 'PC のみの仕様')
    await openFirstProject(page)
    const imageBox = await page.locator('.p-project__image').first().boundingBox()
    const viewportHeight = page.viewportSize()?.height ?? 0
    const imageCenterY = (imageBox?.y ?? 0) + (imageBox?.height ?? 0) / 2
    // 上下に --page-block-start（32px 固定）の余白が残らないほど縦長の写真は上端で止めるため、検証しない
    const pageBlockStartPx = 32
    test.skip(
      (imageBox?.height ?? Infinity) > viewportHeight - pageBlockStartPx * 2,
      '写真が画面に対して縦長すぎる'
    )
    expect(Math.abs(imageCenterY - viewportHeight / 2)).toBeLessThanOrEqual(1)
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

  test('SP: ページヘッダーの氏名は TOP へのリンクとして押せる', async ({ page }) => {
    test.skip(isPcViewport(page), 'SP のみの仕様')
    await openFirstProject(page)
    await expectHeaderLinksToTop(page)
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
