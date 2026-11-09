import type { ResponsiveImage } from '@/lib/microcms/image'

/**
 * 下書きプレビューで DOM を組み立てる共通関数。
 * CMS の文字列は必ず textContent / setAttribute で設定し、innerHTML を使わない（DOM ベースの XSS 対策、要件⑦）。
 */

/** 要素に設定する属性（属性名 → 値） */
export type Attributes = Readonly<Record<string, string>>

/**
 * @function createElement
 * @description クラス名・属性・テキストを指定して要素を生成する
 * @param {K} tag - タグ名
 * @param {string} className - クラス名（空白区切りで複数指定可。空文字なら付けない）
 * @param {Attributes} attributes - 属性
 * @param {string} text - テキスト（textContent として設定する）
 * @returns {HTMLElementTagNameMap[K]} 生成した要素
 */
export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className = '',
  attributes: Attributes = {},
  text = ''
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tag)
  if (className.length > 0) {
    element.className = className
  }
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value))
  if (text.length > 0) {
    element.textContent = text
  }
  return element
}

/**
 * @function appendLines
 * @description 行の並びを <br> 区切りで要素に追加する（Astro のビューの改行表現と揃える）
 * @param {HTMLElement} parent - 追加先の要素
 * @param {readonly (readonly (Node | string)[])[]} lines - 行ごとのノード（文字列はテキストとして追加される）
 * @returns {void}
 */
export const appendLines = (
  parent: HTMLElement,
  lines: readonly (readonly (Node | string)[])[]
): void => {
  lines.forEach((nodes, i) => {
    if (i > 0) {
      parent.append(createElement('br'))
    }
    parent.append(...nodes)
  })
}

/**
 * @function createPicture
 * @description components/ResponsivePicture.astro と同じ構造の <picture> を生成する
 * @param {ResponsiveImage} image - buildResponsiveImage で算出済みの画像
 * @param {string} className - <img> のクラス名
 * @param {Attributes} attributes - <img> に設定する属性（alt / loading など）
 * @param {Attributes} style - <img> に設定する CSS カスタムプロパティ
 * @returns {HTMLPictureElement} 生成した <picture>
 */
export const createPicture = (
  image: ResponsiveImage,
  className: string,
  attributes: Attributes,
  style: Attributes = {}
): HTMLPictureElement => {
  const picture = createElement('picture', 'c-picture')
  picture.append(
    ...image.sources.map((source) =>
      createElement('source', '', { type: source.type, srcset: source.srcset, sizes: image.sizes })
    )
  )
  // <picture> に入れてから src を設定する。先に設定すると <source>（AVIF）を考慮せず
  // <img> の WebP を読み込み始め、二重ダウンロードになるため。
  // loading も src より先に設定しないと遅延読み込みにならない。
  const img = createElement('img', className)
  picture.append(img)
  Object.entries({
    ...attributes,
    width: String(image.width),
    height: String(image.height),
    sizes: image.sizes,
    srcset: image.srcset,
    src: image.src,
  }).forEach(([name, value]) => img.setAttribute(name, value))
  Object.entries(style).forEach(([name, value]) => img.style.setProperty(name, value))
  return picture
}
