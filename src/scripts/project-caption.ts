/**
 * Project 詳細（PC）の概要エリアの高さを CSS カスタムプロパティとして渡す。
 *
 * 概要エリアは「エリア全体が画面の縦中央に来た位置」で sticky 固定する
 * （top = (100svh - エリアの高さ) / 2）。エリアの高さは本文の量で変わり、
 * CSS では要素自身の高さを参照できないため、ここで計測して渡す。
 * スクロールイベントは使わず、サイズが変わったとき（ResizeObserver）だけ更新する（要件⑥）。
 *
 * スクリプトが動かない環境では、CSS 側のフォールバック（プロフィールと同じ高さで固定）になる。
 */

/** 概要エリア要素 */
const CAPTION_SELECTOR = '.js-project-caption'

/** 計測した高さを渡す CSS カスタムプロパティ（project-detail.css と一致させること） */
export const CAPTION_SIZE_PROPERTY = '--project-caption-block-size'

/** ResizeObserver の計測結果のうち、本処理で参照する値 */
type BlockSizeEntry = Pick<ResizeObserverEntry, 'borderBoxSize' | 'contentRect'>

/**
 * @function getBorderBlockSize
 * @description ResizeObserver の計測結果から、ボーダーボックスの高さ（縦書きでない場合）を取り出す。
 *              borderBoxSize 未対応の環境では contentRect の高さで代替する（概要エリアは padding / border なし）。
 * @param {BlockSizeEntry} entry - ResizeObserver の計測結果
 * @returns {number} 高さ（CSS px）
 */
export const getBorderBlockSize = (entry: BlockSizeEntry): number =>
  entry.borderBoxSize.at(0)?.blockSize ?? entry.contentRect.height

/**
 * @function initProjectCaption
 * @description ページ内の概要エリアの高さを監視し、CSS カスタムプロパティに反映する
 * @returns {void}
 */
export const initProjectCaption = (): void => {
  const captions = document.querySelectorAll<HTMLElement>(CAPTION_SELECTOR)
  if (captions.length === 0 || !('ResizeObserver' in window)) {
    return
  }

  const observer = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target instanceof HTMLElement) {
        entry.target.style.setProperty(CAPTION_SIZE_PROPERTY, `${getBorderBlockSize(entry)}px`)
      }
    })
  })
  captions.forEach((caption) => observer.observe(caption))
}
