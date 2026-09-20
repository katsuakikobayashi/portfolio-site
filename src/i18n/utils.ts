import { DEFAULT_LOCALE, LOCALES, type Locale } from './config'

/**
 * @function isLocale
 * @description 任意の文字列が対応ロケールかどうかを判定する型ガード
 * @param {string} value - 判定対象の文字列
 * @returns {boolean} 対応ロケールであれば true
 */
export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value)

/**
 * @function getRouteKey
 * @description URL パスからロケールプレフィックスを除いたルート識別子を取り出す
 * @param {string} pathname - 対象のパス（例: '/en/about/'）
 * @returns {string} ルート識別子。TOP ページは空文字（例: 'about'）
 */
export const getRouteKey = (pathname: string): string => {
  const segments = pathname.split('/').filter(Boolean)
  const [first] = segments
  const withoutLocale = first !== undefined && isLocale(first) ? segments.slice(1) : segments
  return withoutLocale.join('/')
}

/**
 * @function getLocaleFromPath
 * @description URL パスから現在のロケールを判定する
 * @param {string} pathname - 対象のパス（例: '/en/about/'）
 * @returns {Locale} 判定結果。プレフィックスがなければ既定ロケール
 */
export const getLocaleFromPath = (pathname: string): Locale => {
  const [first] = pathname.split('/').filter(Boolean)
  return first !== undefined && isLocale(first) ? first : DEFAULT_LOCALE
}

/**
 * @function localizePath
 * @description ルート識別子とロケールから公開 URL のパスを組み立てる
 * @param {string} routeKey - ルート識別子（TOP は空文字、下層は 'about' など）
 * @param {Locale} locale - 対象ロケール
 * @returns {string} 末尾スラッシュ付きの絶対パス（例: '/en/about/'）
 */
export const localizePath = (routeKey: string, locale: Locale): string => {
  const normalized = routeKey.split('/').filter(Boolean).join('/')
  const prefix = locale === DEFAULT_LOCALE ? '' : locale
  const segments = [prefix, normalized].filter(Boolean)
  return segments.length === 0 ? '/' : `/${segments.join('/')}/`
}

/**
 * @function getAlternatePath
 * @description 同一ページの別ロケール版パスを返す（hreflang / 言語スイッチ用）
 * @param {string} pathname - 現在のパス
 * @param {Locale} locale - 切り替え先のロケール
 * @returns {string} 切り替え先のパス
 */
export const getAlternatePath = (pathname: string, locale: Locale): string =>
  localizePath(getRouteKey(pathname), locale)
