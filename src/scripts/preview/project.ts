import type { Locale } from '@/i18n/config'
import { useTranslations } from '@/i18n/ui'
import {
  PROJECT_RATIO_PROPERTY,
  toMediaRatio,
  toProjectPageTitle,
  type ProjectView,
} from '@/lib/page-content'
import { appendLines, createElement, createPicture } from './dom'

/** 本文エリアの見出し ID（ProjectDetailView.astro の aria-labelledby と揃える） */
const TEXT_HEADING_ID = 'project-text-heading'

/**
 * @function createTextSection
 * @description 本文エリア（段落・強調）を生成する
 * @param {ProjectView} view - 下書きの表示内容
 * @param {Locale} locale - 表示ロケール
 * @returns {HTMLElement} 本文の <section>
 */
const createTextSection = (view: ProjectView, locale: Locale): HTMLElement => {
  // PC ではエリア内スクロールになるため、キーボードでもスクロールできるよう tabindex を付ける
  const section = createElement('section', 'p-project__text', {
    tabindex: '0',
    'aria-labelledby': TEXT_HEADING_ID,
  })
  section.append(
    createElement(
      'h2',
      'u-visually-hidden',
      { id: TEXT_HEADING_ID },
      useTranslations(locale)('project.textLabel')
    ),
    ...view.paragraphs.map((lines) => {
      const paragraph = createElement('p', 'p-project__paragraph')
      appendLines(
        paragraph,
        lines.map((segments) =>
          segments.map((segment) =>
            segment.isEmphasized
              ? createElement('span', 'p-project__emphasis', {}, segment.text)
              : segment.text
          )
        )
      )
      return paragraph
    })
  )
  return section
}

/**
 * @function createGallery
 * @description 写真の縦並びを生成する
 * @param {ProjectView} view - 下書きの表示内容
 * @returns {HTMLElement} 写真の <ol>
 */
const createGallery = (view: ProjectView): HTMLElement => {
  const gallery = createElement('ol', 'p-project__gallery')
  gallery.append(
    ...view.images.map((image, i) => {
      const item = createElement('li', 'p-project__gallery-item')
      // 1 枚目は LCP 候補のため即時・高優先度で読み込み、2 枚目以降は遅延読み込みにする
      const isLead = i === 0
      item.append(
        createPicture(
          image,
          'p-project__image',
          {
            alt: `${view.title} ${i + 1}`,
            loading: isLead ? 'eager' : 'lazy',
            fetchpriority: isLead ? 'high' : 'auto',
            decoding: 'async',
          },
          { '--project-image-aspect': `${image.width} / ${image.height}` }
        )
      )
      return item
    })
  )
  return gallery
}

/**
 * @function renderProjectPreview
 * @description Project の下書き（タイトル・年・本文・写真）を描画する
 *              （components/ProjectDetailView.astro と同じ構造）。
 *              概要エリアの高さは main.ts の initProjectCaption（ResizeObserver）が追従する。
 * @param {ProjectView} view - 下書きの表示内容（toProjectView で変換済み）
 * @param {Locale} locale - 表示ロケール
 * @returns {void}
 */
export const renderProjectPreview = (view: ProjectView, locale: Locale): void => {
  const main = document.querySelector<HTMLElement>('.p-project')
  const article = main?.querySelector<HTMLElement>('.p-project__article')
  const caption = article?.querySelector<HTMLElement>('.js-project-caption')
  const header = caption?.querySelector<HTMLElement>('.p-project__header')
  const title = header?.querySelector<HTMLElement>('.p-project__title')
  if (!main || !article || !caption || !header || !title) {
    return
  }

  document.title = toProjectPageTitle(view.title, locale)
  main.style.setProperty(PROJECT_RATIO_PROPERTY.lead, String(toMediaRatio(view.images.at(0))))
  main.style.setProperty(PROJECT_RATIO_PROPERTY.last, String(toMediaRatio(view.images.at(-1))))
  title.textContent = view.title

  if (view.year) {
    header.append(createElement('p', 'p-project__year', {}, view.year))
  }
  if (view.paragraphs.length > 0) {
    caption.append(createTextSection(view, locale))
  }
  if (view.images.length > 0) {
    article.append(createGallery(view))
  }
}
