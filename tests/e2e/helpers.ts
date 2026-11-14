import type { Page } from '@playwright/test'

/**
 * @function openMenuIfCollapsed
 * @description SP 幅ではフッターナビが「＋」メニューに畳まれているため、
 *              ボタンが表示されている場合に限り開いてリンクを操作可能にする。
 *              PC 幅ではナビが常時表示のため何もしない。
 * @param {Page} page - 対象ページ
 * @returns {Promise<void>}
 */
export const openMenuIfCollapsed = async (page: Page): Promise<void> => {
  const toggle = page.locator('.js-site-menu-toggle')
  if (await toggle.isVisible()) {
    await toggle.click()
  }
}

/**
 * @function isPcViewport
 * @description PC レイアウト（64rem 以上）で表示されているかを判定する
 * @param {Page} page - 対象ページ
 * @returns {boolean} PC レイアウトなら true
 */
export const isPcViewport = (page: Page): boolean => (page.viewportSize()?.width ?? 0) >= 1024

/**
 * @function getLinkHrefAtPoint
 * @description 画面上の座標をタップしたときに反応するリンク（座標の最前面にある要素を含む a 要素）の href を返す
 * @param {Page} page - 対象ページ
 * @param {number} x - ビューポート左端からの X 座標（px）
 * @param {number} y - ビューポート上端からの Y 座標（px）
 * @returns {Promise<string | null>} 反応するリンクの href。リンクがなければ null
 */
export const getLinkHrefAtPoint = (page: Page, x: number, y: number): Promise<string | null> =>
  page.evaluate(
    ([pointX, pointY]) =>
      document.elementFromPoint(pointX, pointY)?.closest('a')?.getAttribute('href') ?? null,
    [x, y] as const
  )

/** 要素の左右端（ビューポート左端からの X 座標・px） */
export interface InlineEdges {
  left: number
  right: number
}

/**
 * @function getContactLineEdges
 * @description フッターの Contact〜instagram の 1 行の、文字が実際に描かれている範囲の左右端を返す。
 *              ブロック自体はグリッドのカラム幅に広がるため、中身の文字範囲（Range）で測る
 * @param {Page} page - 対象ページ
 * @returns {Promise<InlineEdges>} 1 行の左右端
 */
export const getContactLineEdges = (page: Page): Promise<InlineEdges> =>
  page.evaluate(() => {
    const range = document.createRange()
    const contact = document.querySelector('.p-site-footer__contact')
    if (contact !== null) {
      range.selectNodeContents(contact)
    }
    const { left, right } = range.getBoundingClientRect()
    return { left, right }
  })
