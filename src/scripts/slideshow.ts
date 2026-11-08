/** 1 枚あたりの表示時間（ms） */
export const SLIDE_INTERVAL_MS = 5000

/** 表示中のスライドに付与する状態クラス */
const ACTIVE_CLASS = 'is-active'

/**
 * スライドショーを動かす条件。
 * - SP ではスライド自体を表示しない（デザイン指定）ため、PC 幅のときだけ動かす
 * - OS で「視差効果を減らす」が有効なら 1 枚目で止める
 * ブレークポイントは site-footer.css / layout.css の PC 切り替え幅と一致させること。
 */
const PLAYABLE_QUERY = '(width >= 64rem) and (prefers-reduced-motion: no-preference)'

/**
 * @function getNextIndex
 * @description 現在の位置から次のスライド番号を求める（末尾の次は先頭に戻る）
 * @param {number} current - 現在のスライド番号
 * @param {number} length - スライド総数
 * @returns {number} 次のスライド番号
 */
export const getNextIndex = (current: number, length: number): number => (current + 1) % length

/**
 * @function setupSlideshow
 * @description 1 つのスライドショー要素に自動フェード切り替えを設定する
 * @param {HTMLElement} root - `.js-slideshow` 要素
 * @returns {void}
 */
const setupSlideshow = (root: HTMLElement): void => {
  const slides = Array.from(root.querySelectorAll<HTMLElement>('.js-slideshow-item'))
  if (slides.length < 2) {
    return
  }

  const playable = window.matchMedia(PLAYABLE_QUERY)
  const state = { index: 0, timerId: 0 }

  const showNext = (): void => {
    const next = getNextIndex(state.index, slides.length)
    slides[state.index]?.classList.remove(ACTIVE_CLASS)
    slides[next]?.classList.add(ACTIVE_CLASS)
    state.index = next
  }

  const stop = (): void => {
    window.clearInterval(state.timerId)
    state.timerId = 0
  }

  // 非表示タブや SP 幅では止め、不要な再描画と電力消費を避ける
  const sync = (): void => {
    const shouldPlay = playable.matches && document.visibilityState === 'visible'
    if (shouldPlay && state.timerId === 0) {
      state.timerId = window.setInterval(showNext, SLIDE_INTERVAL_MS)
    } else if (!shouldPlay) {
      stop()
    }
  }

  playable.addEventListener('change', sync)
  document.addEventListener('visibilitychange', sync)
  sync()
}

/**
 * @function initSlideshows
 * @description ページ内のすべての `.js-slideshow` を初期化する
 * @returns {void}
 */
export const initSlideshows = (): void => {
  document.querySelectorAll<HTMLElement>('.js-slideshow').forEach(setupSlideshow)
}
