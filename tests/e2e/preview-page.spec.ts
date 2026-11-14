import { expect, test, type Page } from '@playwright/test'

/**
 * microCMS の下書きプレビュー（/preview/・/en/preview/）。
 * 下書きの内容は実際の CMS に依存させず、ブラウザからの API 呼び出しをモックして検証する。
 */

/** ブラウザから microCMS の API を呼ぶ URL（サービスドメインは問わない） */
const MICROCMS_API = /^https:\/\/[^/]+\.microcms\.io\/api\/v1\//

const image = {
  url: 'https://images.microcms-assets.io/assets/x/y/draft.jpg',
  width: 1200,
  height: 1600,
}

/** 下書きのレスポンス（エンドポイント → JSON） */
const DRAFTS: Readonly<Record<string, unknown>> = {
  top: {
    createdAt: '',
    updatedAt: '',
    sliderImages: [
      {
        id: 'p1',
        createdAt: '',
        updatedAt: '',
        title: 'Draft Slide 1',
        url: 'slide_1',
        thumbnail: image,
      },
      {
        id: 'p2',
        createdAt: '',
        updatedAt: '',
        title: 'Draft Slide 2',
        url: 'slide_2',
        images: [image],
      },
    ],
  },
  about: {
    createdAt: '',
    updatedAt: '',
    name: '下書きの氏名',
    nameEn: 'Draft Name',
    // HTML として解釈されないこと（XSS 対策）を確認するため、タグを含めておく
    text: '<img src=x onerror=alert(1)>一行目\n二行目',
    textEn: 'Draft line one\nline two',
    image,
    imageCaption: 'Draft caption',
  },
  'projects/draft-id': {
    id: 'draft-id',
    createdAt: '',
    updatedAt: '',
    title: 'Draft Project',
    url: 'draft_project',
    year: '2026',
    body: '<p>本文<span class="custom">強調</span></p>',
    images: [image],
  },
}

/**
 * @function mockMicrocms
 * @description microCMS の API 呼び出しをモックし、呼び出された URL を記録する
 * @param {Page} page - 対象ページ
 * @returns {Promise<URL[]>} 呼び出された URL の一覧（呼び出しのたびに追加される）
 */
const mockMicrocms = async (page: Page): Promise<URL[]> => {
  const requested: URL[] = []
  await page.route(MICROCMS_API, (route) => {
    const url = new URL(route.request().url())
    requested.push(url)
    const resource = url.pathname.replace('/api/v1/', '')
    const body = DRAFTS[resource]
    return body === undefined
      ? route.fulfill({ status: 404, json: { message: 'not found' } })
      : route.fulfill({ json: body, headers: { 'Access-Control-Allow-Origin': '*' } })
  })
  return requested
}

/**
 * @function collectConsoleProblems
 * @description コンソールの Error / Warning を記録する
 * @param {Page} page - 対象ページ
 * @returns {string[]} 記録されたメッセージ（発生のたびに追加される）
 */
const collectConsoleProblems = (page: Page): string[] => {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      problems.push(message.text())
    }
  })
  return problems
}

test.describe('下書きプレビュー', () => {
  test.beforeEach(async ({ page }) => {
    // 下書きの画像（モックの URL）は取得させない
    await page.route(/images\.microcms-assets\.io\/assets\/x\//, (route) =>
      route.fulfill({ status: 204 })
    )
  })

  const redirects = [
    ['/preview/', '/'],
    ['/preview/about/', '/about/'],
    ['/preview/projects/', '/projects/'],
    ['/en/preview/', '/en/'],
    ['/en/preview/about/', '/en/about/'],
    ['/en/preview/projects/', '/en/projects/'],
  ] as const

  for (const [previewPath, publicPath] of redirects) {
    test(`クエリなしで ${previewPath} にアクセスすると ${publicPath} へ移動する`, async ({
      page,
    }) => {
      await page.goto(previewPath)
      await expect(page).toHaveURL(publicPath)
    })
  }

  test('不正な形式の値は API を呼ばずに公開ページへ移動する', async ({ page }) => {
    const requested = await mockMicrocms(page)
    await page.goto('/preview/projects/?contentId=..%2Fabout&draftKey=key')
    await expect(page).toHaveURL('/projects/')
    expect(requested).toHaveLength(0)
  })

  test('TOP: 下書きのスライド写真を描画する', async ({ page }) => {
    const requested = await mockMicrocms(page)
    await page.goto('/preview/?draftKey=draft_key')

    await expect(page.locator('.js-preview-status')).toHaveText('下書きプレビュー')
    await expect(page.locator('.p-slideshow__item')).toHaveCount(2)
    await expect(page.locator('.p-slideshow__item.is-active')).toHaveCount(1)
    await expect(page.locator('.p-slideshow__link').first()).toHaveAttribute(
      'href',
      '/projects/slide_1/'
    )
    await expect(page.locator('.p-slideshow__image').first()).toHaveAttribute(
      'alt',
      'Draft Slide 1'
    )
    await expect(page.locator('.p-slideshow__item').nth(1)).toHaveAttribute('inert', '')
    expect(requested[0]?.searchParams.get('draftKey')).toBe('draft_key')
  })

  test('About: 下書きの氏名・本文・写真を描画し、本文を HTML として解釈しない', async ({
    page,
  }) => {
    await mockMicrocms(page)
    const problems = collectConsoleProblems(page)
    await page.goto('/preview/about/?draftKey=draft_key')

    await expect(page.locator('.js-preview-status')).toHaveText('下書きプレビュー')
    await expect(page.locator('.p-about__name')).toHaveText('下書きの氏名')
    const paragraph = page.locator('.p-about__paragraph')
    await expect(paragraph).toHaveCount(1)
    await expect(paragraph).toContainText('<img src=x onerror=alert(1)>一行目')
    await expect(paragraph.locator('br')).toHaveCount(1)
    await expect(paragraph.locator('img')).toHaveCount(0)

    const photo = page.locator('.p-about__photo-image')
    await expect(photo).toHaveAttribute('srcset', /fm=webp/)
    await expect(photo).toHaveAttribute('width', /\d+/)
    await expect(page.locator('.p-about__photo source')).toHaveAttribute('type', 'image/avif')
    await expect(page.locator('.p-about__photo-caption')).toHaveText('Draft caption')
    expect(problems).toEqual([])
  })

  test('About（英語）: 英語の下書きを描画する', async ({ page }) => {
    await mockMicrocms(page)
    await page.goto('/en/preview/about/?draftKey=draft_key')
    await expect(page.locator('.js-preview-status')).toHaveText('Draft preview')
    await expect(page.locator('.p-about__name')).toHaveText('Draft Name')
  })

  test('Project: contentId と draftKey で下書きを取得し、詳細ページと同じ構造で描画する', async ({
    page,
  }) => {
    const requested = await mockMicrocms(page)
    await page.goto('/preview/projects/?contentId=draft-id&draftKey=draft_key')

    await expect(page.locator('.js-preview-status')).toHaveText('下書きプレビュー')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Draft Project')
    await expect(page).toHaveTitle(/^Draft Project \| Projects/)
    await expect(page.locator('.p-project__year')).toHaveText('2026')
    await expect(page.locator('.p-project__emphasis')).toHaveText('強調')
    await expect(page.locator('.p-project__image')).toHaveCount(1)
    await expect(page.locator('.p-project__image')).toHaveAttribute('fetchpriority', 'high')
    expect(requested[0]?.pathname).toBe('/api/v1/projects/draft-id')
  })

  test('言語切り替えのリンクに下書きのクエリを引き継ぐ', async ({ page }) => {
    await mockMicrocms(page)
    await page.goto('/preview/projects/?contentId=draft-id&draftKey=draft_key')
    await expect(page.locator('.js-preview-status')).toHaveText('下書きプレビュー')
    await expect(page.locator('.js-lang-switch-link')).toHaveAttribute(
      'href',
      /\/en\/preview\/projects\/\?draftKey=draft_key&contentId=draft-id$/
    )
  })

  test('存在しない contentId は「見つかりません」と表示する', async ({ page }) => {
    await mockMicrocms(page)
    await page.goto('/preview/projects/?contentId=missing&draftKey=draft_key')
    await expect(page.locator('.js-preview-status')).toContainText('見つかりません')
  })

  test('検索エンジンにインデックスさせない', async ({ page }) => {
    await mockMicrocms(page)
    await page.goto('/preview/about/?draftKey=draft_key')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  })

  test('公開ページには下書きプレビューのスクリプトと状態表示を出力しない', async ({ page }) => {
    await page.goto('/about/')
    await expect(page.locator('.js-preview-status')).toHaveCount(0)
  })

  test('robots.txt でプレビューを除外し、sitemap に載せない', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text()
    expect(robots).toContain('Disallow: /preview/')
    expect(robots).toContain('Disallow: /en/preview/')
    const sitemap = await (await request.get('/sitemap-0.xml')).text()
    expect(sitemap).not.toContain('/preview/')
  })
})
