/**
 * 対応ロケール。astro.config.mjs の i18n.locales と必ず一致させること。
 */
export const LOCALES = ['ja', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/** URL プレフィックスを持たない既定ロケール */
export const DEFAULT_LOCALE: Locale = 'ja'

/** 言語スイッチに表示するラベル（デザイン指定では日本語を "jp" と表記する） */
export const LOCALE_LABELS: Record<Locale, string> = {
  ja: 'jp',
  en: 'en',
}

/** html 要素の lang 属性値 */
export const HTML_LANG: Record<Locale, string> = {
  ja: 'ja',
  en: 'en',
}

/** hreflang 属性値 */
export const HREF_LANG: Record<Locale, string> = {
  ja: 'ja-JP',
  en: 'en-US',
}

/** og:locale 属性値 */
export const OG_LOCALE: Record<Locale, string> = {
  ja: 'ja_JP',
  en: 'en_US',
}
