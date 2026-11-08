import { LOCALE_LABELS } from '../i18n/config'
import { dictionary } from '../i18n/ui'
import {
  createMicrocmsClient,
  fetchAllProjectContents,
  type FetchLike,
  type MicrocmsConfig,
} from './microcms/client'

/**
 * Noto Sans JP を「サイトで使う文字だけ」に絞るための文字収集。
 *
 * Google Fonts の日本語フォントは約 120 の unicode-range に分割して配信され、
 * そのまま使うと全ページの <head> に約 120 個の @font-face（約 96KB）がインライン展開される。
 * 使う文字を Astro Fonts の `glyphs` オプション（Google Fonts の `text=`）に渡し、
 * @font-face とフォントファイルを最小限にする（Lighthouse「未使用の CSS」/ Ecograder 対策）。
 *
 * astro.config.mjs から呼ぶため、astro:env 等の Astro 専用モジュールに依存させないこと
 * （import は相対パスのみ）。
 */

/**
 * @function collectStrings
 * @description JSON 値に含まれる文字列をすべて取り出す（オブジェクト・配列は再帰的にたどる）。
 *              CMS のフィールド構成が変わっても取りこぼさないよう、キー名ではなく値の型で判定する。
 * @param {unknown} value - API レスポンス等の JSON 値
 * @returns {string[]} 含まれる文字列の配列
 */
export const collectStrings = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings)
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

/**
 * @function toGlyphs
 * @description 文字列群から、描画される文字を重複なしでコードポイント順に返す。
 *              空白・制御文字は字形を持たないため除外する。
 * @param {readonly string[]} texts - 対象の文字列
 * @returns {string[]} 1 文字ずつの配列
 */
export const toGlyphs = (texts: readonly string[]): string[] => {
  const glyphs = new Set(texts.flatMap((text) => [...text]).filter((char) => /\S/u.test(char)))
  return [...glyphs].toSorted((a, b) => (a.codePointAt(0) ?? 0) - (b.codePointAt(0) ?? 0))
}

/**
 * マークアップに直接書いている記号（SiteFooter.astro の矢印）。
 * Roboto の latin サブセットには含まれず Noto Sans JP で描画されるため、ここで明示する。
 * コンポーネントに Roboto に無い記号を追加した場合はここにも追加すること。
 */
export const MARKUP_SYMBOLS: readonly string[] = ['←', '→']

/**
 * @function getStaticTexts
 * @description コード内で定義している画面表示文言（UI 辞書・言語ラベル・記号）を返す
 * @returns {string[]} 文言の配列
 */
export const getStaticTexts = (): string[] => [
  ...collectStrings(dictionary),
  ...Object.values(LOCALE_LABELS),
  ...MARKUP_SYMBOLS,
]

/**
 * @function fetchSiteGlyphs
 * @description UI 文言と microCMS の全コンテンツ（top / about / projects）から、サイトで使う文字を集める。
 *              CMS の文章を更新した場合は再ビルドで反映される（静的サイトのため、ページ側と同じタイミング）。
 * @param {MicrocmsConfig} config - microCMS の接続設定
 * @param {FetchLike} fetchFn - HTTP クライアント（既定はグローバルの fetch。テストで差し替える）
 * @returns {Promise<string[]>} 1 文字ずつの配列
 * @throws {Error} microCMS の取得に失敗した場合（ページ生成と同様にビルドを止める）
 */
export const fetchSiteGlyphs = async (
  config: MicrocmsConfig,
  fetchFn: FetchLike = fetch
): Promise<string[]> => {
  const client = createMicrocmsClient(config, fetchFn)
  const [top, about, projects] = await Promise.all([
    client.get('top'),
    client.get('about'),
    fetchAllProjectContents(client.get),
  ])
  return toGlyphs([...getStaticTexts(), ...collectStrings([top, about, projects])])
}
