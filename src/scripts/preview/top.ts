import type { TopSlide } from '@/lib/page-content'
import { initSlideshows } from '@/scripts/slideshow'
import { createElement, createPicture } from './dom'

/**
 * @function renderTopPreview
 * @description TOP の下書きのスライドを描画する（components/Slideshow.astro と同じ構造）。
 *              スライドショーは main.ts の初期化時点では存在しないため、描画後に初期化する。
 * @param {readonly TopSlide[]} slides - 下書きのスライド（toTopSlides で変換済み）
 * @returns {void}
 */
export const renderTopPreview = (slides: readonly TopSlide[]): void => {
  const main = document.querySelector<HTMLElement>('.p-top')
  if (main === null || slides.length === 0) {
    return
  }

  const list = createElement('ul', 'p-slideshow js-slideshow p-top__slideshow')
  list.append(
    ...slides.map((slide, i) => {
      const isFirst = i === 0
      // 最初の 1 枚を表示状態にし、残りは inert にする（Slideshow.astro と同じ）
      const item = createElement(
        'li',
        isFirst
          ? 'p-slideshow__item js-slideshow-item is-active'
          : 'p-slideshow__item js-slideshow-item'
      )
      item.inert = !isFirst
      // href は toTopSlides が検証済みのスラッグから組み立てたサイト内パス
      const link = createElement('a', 'p-slideshow__link', { href: slide.href })
      link.append(
        createPicture(slide.image, 'p-slideshow__image', {
          alt: slide.title,
          loading: 'lazy',
          decoding: 'async',
        })
      )
      item.append(link)
      return item
    })
  )
  main.append(list)
  initSlideshows()
}
