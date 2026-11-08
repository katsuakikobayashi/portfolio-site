import type { MicrocmsImage } from './types'

/**
 * microCMS 画像 API（imgix 互換）で配信する際の変換設定。
 * https://document.microcms.io/image-api/introduction
 */

/** 配信フォーマット。全ブラウザで WebP に統一する（要件⑤） */
const IMAGE_FORMAT = 'webp'

/**
 * 端末のピクセル密度（DPR）ごとの画質。
 * 高 DPR 端末では 1 画素が物理的に小さく圧縮ノイズが視認されにくいため、
 * 解像度を上げるぶん画質を下げて転送量の増加を抑える（imgix の推奨手法）。
 * https://document.microcms.io/image-api/dpr
 * https://document.microcms.io/image-api/quality
 */
export const DPR_QUALITY = {
  1: 80,
  2: 60,
  3: 45,
} as const satisfies Record<number, number>

export type Dpr = keyof typeof DPR_QUALITY

/** srcset に並べる DPR（小さい順） */
export const DPRS: readonly Dpr[] = [1, 2, 3]

export interface ImageUrlOptions {
  /** CSS ピクセルでの表示幅 */
  width: number
  dpr: Dpr
}

/** <img> にそのまま展開できる属性一式 */
export interface ResponsiveImage {
  src: string
  srcset: string
  sizes: string
  width: number
  height: number
}

/**
 * @function buildImageUrl
 * @description 表示幅と DPR から、WebP・画質最適化済みの画像 API URL を生成する
 * @param {string} url - microCMS が返す画像の元 URL
 * @param {ImageUrlOptions} options - 表示幅（CSS px）と DPR
 * @returns {string} 変換パラメータ付きの URL
 */
export const buildImageUrl = (url: string, { width, dpr }: ImageUrlOptions): string => {
  const target = new URL(url)
  target.searchParams.set('fm', IMAGE_FORMAT)
  target.searchParams.set('w', String(Math.round(width)))
  target.searchParams.set('dpr', String(dpr))
  target.searchParams.set('q', String(DPR_QUALITY[dpr]))
  return target.href
}

/**
 * @function buildResponsiveImage
 * @description DPR 1x〜3x の候補を w 記述子の srcset として並べた <img> 属性を生成する。
 *              表示幅がビューポートに応じて可変するため x 記述子ではなく w 記述子を使い、
 *              実際の候補選択（表示幅 × 端末 DPR）はブラウザに委ねる。
 *              元画像の幅を超える候補は拡大になり無意味なため除外する。
 * @param {MicrocmsImage} image - microCMS の画像フィールド
 * @param {number} displayWidth - 想定する最大表示幅（CSS px）
 * @param {string} sizes - <img sizes> の値
 * @returns {ResponsiveImage} src / srcset / sizes / width / height
 */
export const buildResponsiveImage = (
  image: MicrocmsImage,
  displayWidth: number,
  sizes: string
): ResponsiveImage => {
  const candidates = DPRS.filter((dpr) => dpr === 1 || displayWidth * dpr <= image.width)
  const srcset = candidates
    .map(
      (dpr) => `${buildImageUrl(image.url, { width: displayWidth, dpr })} ${displayWidth * dpr}w`
    )
    .join(', ')

  return {
    src: buildImageUrl(image.url, { width: displayWidth, dpr: 1 }),
    srcset,
    sizes,
    // width / height は表示比率を伝えるための値（CLS 対策）。表示幅に合わせて算出する
    width: displayWidth,
    height: Math.round((displayWidth * image.height) / image.width),
  }
}
