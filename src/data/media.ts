/**
 * CMS 画像の表示サイズ定義（srcset / sizes の算出元）。
 * 値はカンプ（PC 1400px 幅・左右余白 60px・コンテンツ幅 1280px）の実測値で、
 * tokens.css の --grid-columns-4 と対応している。グリッドを変える場合は両方を更新すること。
 */

/** PC の左右余白の合計（60px × 2 = 7.5rem） */
const PAGE_INLINE_TOTAL = '7.5rem'

/**
 * @function columnSizes
 * @description コンテンツ幅に対する比率から <img sizes> の値を組み立てる
 * @param {number} ratio - コンテンツ幅に対する表示幅の比率
 * @returns {string} sizes 属性値
 */
const columnSizes = (ratio: number): string => `calc((100vw - ${PAGE_INLINE_TOTAL}) * ${ratio})`

/** TOP のスライド写真: 第 3 カラム全幅（375 / 1280） */
export const TOP_SLIDE = {
  displayWidth: 375,
  sizes: columnSizes(375 / 1280),
} as const

/** About の写真: 第 4 カラム右寄せ（300 / 1280） */
export const ABOUT_PHOTO = {
  displayWidth: 300,
  sizes: columnSizes(300 / 1280),
} as const

/**
 * PC レイアウトに切り替わる幅。CSS 側（layout.css ほか）と一致させること。
 * CSS のメディアクエリではカスタムプロパティを使えないため、ここと CSS の 2 箇所で管理する。
 */
export const PC_MEDIA_QUERY = '(width >= 64rem)'

/** SP レイアウトの幅（PC_MEDIA_QUERY の否定） */
export const SP_MEDIA_QUERY = '(width < 64rem)'

/** SP の左右余白の合計（32px × 2 = 4rem） */
const PAGE_INLINE_TOTAL_SP = '4rem'

/**
 * Projects 一覧のサムネイル。
 * PC: About の写真と同じ第 4 カラム右寄せ（300 / 1280）
 * SP: コンテンツ幅の左寄せ（270 / 329。tokens.css の --grid-content-sp-photo と対応）
 */
export const PROJECT_THUMBNAIL = {
  displayWidth: 300,
  sizes: `${PC_MEDIA_QUERY} ${columnSizes(300 / 1280)}, calc((100vw - ${PAGE_INLINE_TOTAL_SP}) * ${270 / 329})`,
} as const

/**
 * Project 詳細の写真。
 * PC: 中央カラム（450 / 1280。tokens.css の --grid-columns-project と対応）
 * SP: コンテンツ全幅
 */
export const PROJECT_IMAGE = {
  displayWidth: 450,
  sizes: `${PC_MEDIA_QUERY} ${columnSizes(450 / 1280)}, calc(100vw - ${PAGE_INLINE_TOTAL_SP})`,
} as const
