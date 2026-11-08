/** メニューを開いている間フッターに付与する状態クラス */
const OPEN_CLASS = 'is-menu-open'

/**
 * @function setMenuOpen
 * @description メニューの開閉状態を、ボタンの aria-expanded とフッターの状態クラスに反映する
 * @param {HTMLElement} footer - `.js-site-footer` 要素
 * @param {HTMLButtonElement} toggle - 開閉ボタン
 * @param {boolean} isOpen - 開くなら true
 * @returns {void}
 */
const setMenuOpen = (footer: HTMLElement, toggle: HTMLButtonElement, isOpen: boolean): void => {
  toggle.setAttribute('aria-expanded', String(isOpen))
  footer.classList.toggle(OPEN_CLASS, isOpen)
}

/**
 * @function initSiteMenu
 * @description SP のフッターメニュー（＋ / － ボタン）の開閉を初期化する。
 *              Escape キーで閉じ、フォーカスをボタンへ戻す。
 *              PC 幅では CSS 側でナビを常時表示するため、状態は見た目に影響しない。
 * @returns {void}
 */
export const initSiteMenu = (): void => {
  document.querySelectorAll<HTMLElement>('.js-site-footer').forEach((footer) => {
    const toggle = footer.querySelector<HTMLButtonElement>('.js-site-menu-toggle')
    if (!toggle) {
      return
    }

    toggle.addEventListener('click', () => {
      setMenuOpen(footer, toggle, toggle.getAttribute('aria-expanded') !== 'true')
    })

    footer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(footer, toggle, false)
        toggle.focus()
      }
    })
  })
}
