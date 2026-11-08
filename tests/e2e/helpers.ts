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
