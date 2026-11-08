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
 * https://document.microcms.io/image-api/quality
 */
export const DPR_QUALITY = {
  1: 80,
  2: 60,
  3: 45,
} as const satisfies Record<number, number>

export type Dpr = keyof typeof DPR_QUALITY

/** 画質の判定に使う DPR（小さい順） */
export const DPRS: readonly Dpr[] = [1, 2, 3]

/** カンプ等倍（srcset 非対応ブラウザ向けの src に使う） */
const BASE_DPR: Dpr = 1

/**
 * srcset の候補幅（実ピクセル）。
 * 表示幅 × DPR の倍数だけを候補にすると、SP の可変幅（例: 347px × 2 = 694px）に対して
 * 1 段上の候補（900w）まで飛んでしまい転送量が大きく無駄になる。
 * 一定間隔で候補を並べ、必要な幅との差を最大でも 1 間隔ぶんに抑える。
 * 上限はタブレット（SP レイアウト最大 959px × DPR 2 ≒ 1918px）を賄える値にしている。
 */
export const CANDIDATE_WIDTH_STEP = 180
export const MIN_CANDIDATE_WIDTH = 360
export const MAX_CANDIDATE_WIDTH = 1980

export interface ImageUrlOptions {
  /** 配信する実ピクセル幅 */
  width: number
  /** 画質（1〜100） */
  quality: number
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
 * @description 実ピクセル幅と画質から、WebP 変換済みの画像 API URL を生成する
 * @param {string} url - microCMS が返す画像の元 URL
 * @param {ImageUrlOptions} options - 配信幅（実ピクセル）と画質
 * @returns {string} 変換パラメータ付きの URL
 */
export const buildImageUrl = (url: string, { width, quality }: ImageUrlOptions): string => {
  const target = new URL(url)
  target.searchParams.set('fm', IMAGE_FORMAT)
  target.searchParams.set('w', String(Math.round(width)))
  target.searchParams.set('q', String(quality))
  return target.href
}

/**
 * @function qualityForWidth
 * @description 候補幅が想定表示幅の何倍か（≒ どの DPR 向けか）から画質を決める。
 *              w 記述子ではブラウザがどの DPR で候補を選んだか分からないため、
 *              表示幅との比率に最も近い DPR の画質で代用する（1x 未満は 1x、3x 超は 3x 扱い）。
 * @param {number} candidateWidth - 候補の実ピクセル幅
 * @param {number} displayWidth - 想定する表示幅（CSS px）
 * @returns {number} 画質（1〜100）
 */
export const qualityForWidth = (candidateWidth: number, displayWidth: number): number => {
  const density = candidateWidth / displayWidth
  const nearest = DPRS.reduce((best, dpr) =>
    Math.abs(dpr - density) < Math.abs(best - density) ? dpr : best
  )
  return DPR_QUALITY[nearest]
}

/**
 * @function buildCandidateWidths
 * @description srcset に並べる候補幅を小さい順に返す。
 *              元画像を超える幅は拡大になり無意味なため除外し、
 *              代わりに元画像の幅そのものを最大候補として加える。
 * @param {number} sourceWidth - 元画像の幅（実ピクセル）
 * @returns {number[]} 候補幅の配列（1 件以上）
 */
export const buildCandidateWidths = (sourceWidth: number): number[] => {
  const maxWidth = Math.min(sourceWidth, MAX_CANDIDATE_WIDTH)
  const stepCount = Math.floor((maxWidth - MIN_CANDIDATE_WIDTH) / CANDIDATE_WIDTH_STEP) + 1
  const ladder = Array.from(
    { length: Math.max(stepCount, 0) },
    (_, i) => MIN_CANDIDATE_WIDTH + i * CANDIDATE_WIDTH_STEP
  )
  const largest = ladder.at(-1)
  return largest === maxWidth ? ladder : [...ladder, maxWidth]
}

/**
 * @function buildResponsiveImage
 * @description 一定間隔の候補幅を w 記述子の srcset として並べた <img> 属性を生成する。
 *              表示幅がビューポートに応じて可変するため、候補の選択（表示幅 × 端末 DPR）は
 *              sizes を元にブラウザに委ねる。
 * @param {MicrocmsImage} image - microCMS の画像フィールド
 * @param {number} displayWidth - PC カンプ上の表示幅（CSS px）。画質と width / height の基準
 * @param {string} sizes - <img sizes> の値
 * @returns {ResponsiveImage} src / srcset / sizes / width / height
 */
export const buildResponsiveImage = (
  image: MicrocmsImage,
  displayWidth: number,
  sizes: string
): ResponsiveImage => {
  const srcset = buildCandidateWidths(image.width)
    .map(
      (width) =>
        `${buildImageUrl(image.url, { width, quality: qualityForWidth(width, displayWidth) })} ${width}w`
    )
    .join(', ')
  const fallbackWidth = Math.min(displayWidth, image.width)

  return {
    // srcset 非対応ブラウザ向け。カンプの表示幅（1x）で配信する
    src: buildImageUrl(image.url, { width: fallbackWidth, quality: DPR_QUALITY[BASE_DPR] }),
    srcset,
    sizes,
    // width / height は表示比率を伝えるための値（CLS 対策）。表示幅に合わせて算出する
    width: displayWidth,
    height: Math.round((displayWidth * image.height) / image.width),
  }
}
