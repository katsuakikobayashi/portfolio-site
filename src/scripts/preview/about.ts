import type { Locale } from '@/i18n/config'
import { useTranslations } from '@/i18n/ui'
import type { AboutView } from '@/lib/page-content'
import { appendLines, createElement, createPicture } from './dom'

/**
 * @function renderAboutPreview
 * @description About の下書き（氏名・本文・写真）を描画する（components/AboutView.astro と同じ構造）
 * @param {AboutView} view - 下書きの表示内容（toAboutView で変換済み）
 * @param {Locale} locale - 表示ロケール
 * @returns {void}
 */
export const renderAboutPreview = (view: AboutView, locale: Locale): void => {
  const main = document.querySelector<HTMLElement>('.p-about')
  const article = main?.querySelector<HTMLElement>('.p-about__article')
  const name = article?.querySelector<HTMLElement>('.p-about__name')
  if (!main || !article || !name) {
    return
  }

  name.textContent = view.name
  article.append(
    ...view.paragraphs.map((lines) => {
      const paragraph = createElement('p', 'p-about__paragraph')
      appendLines(
        paragraph,
        lines.map((line) => [line])
      )
      return paragraph
    })
  )

  if (view.photo) {
    const figure = createElement('figure', 'p-about__photo')
    figure.append(
      createPicture(view.photo, 'p-about__photo-image', {
        alt: useTranslations(locale)('about.photoAlt'),
        loading: 'lazy',
        decoding: 'async',
      })
    )
    if (view.photoCaption) {
      figure.append(createElement('figcaption', 'p-about__photo-caption', {}, view.photoCaption))
    }
    main.append(figure)
  }
}
