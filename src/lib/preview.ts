import { ROUTES } from '@/data/site'
import type { Locale } from '@/i18n/config'
import { localizePath } from '@/i18n/utils'
import { MicrocmsHttpError } from '@/lib/microcms/client'

/**
 * microCMS の下書きプレビュー（/preview/・/en/preview/）で使う関数群。
 * ページは静的に生成し、下書きはブラウザで取得して描画する（scripts/preview/ を参照）。
 * astro:env と DOM に依存しない純粋関数のみを置き、単体テストの対象にする。
 *
 * microCMS 管理画面「画面プレビュー」に設定する URL の例:
 *   TOP:     https://www.katsuakikobayashi.com/preview/?draftKey={DRAFT_KEY}
 *   About:   https://www.katsuakikobayashi.com/preview/about/?draftKey={DRAFT_KEY}
 *   Project: https://www.katsuakikobayashi.com/preview/projects/?contentId={CONTENT_ID}&draftKey={DRAFT_KEY}
 */

/** プレビュー URL のクエリパラメータ名（microCMS の画面プレビュー設定と一致させること） */
export const PREVIEW_PARAM = {
  draftKey: 'draftKey',
  contentId: 'contentId',
} as const

/** プレビューに対応するページの種類 */
export const PREVIEW_PAGES = ['top', 'about', 'project'] as const

export type PreviewPage = (typeof PREVIEW_PAGES)[number]

/**
 * クエリが無い・不正なときのリダイレクト先（公開中のページ）。
 * Project はコンテンツ ID が分からないと詳細ページを特定できないため、一覧へ戻す。
 */
const FALLBACK_ROUTES: Readonly<Record<PreviewPage, string>> = {
  top: ROUTES.top,
  about: ROUTES.about,
  project: ROUTES.projects,
}

/**
 * draftKey / contentId として受け付ける文字。
 * どちらも microCMS の API リクエスト（パス・クエリ）に入るため、英数字・`-`・`_` に限定し、
 * パストラバーサル（`../`）や別パラメータの注入（`&`）を入口で弾く。
 * 長さの上限は、異常に長い値で microCMS へリクエストしないための安全策。
 */
const PREVIEW_TOKEN_PATTERN = /^[A-Za-z0-9_-]{1,100}$/

/** 下書きの TOP / About を取得するための値 */
export interface DraftParams {
  draftKey: string
}

/** 下書きの Project を取得するための値 */
export interface DraftProjectParams extends DraftParams {
  contentId: string
}

/**
 * @function isPreviewPage
 * @description 任意の文字列がプレビュー対応ページの種類かを判定する型ガード
 * @param {string | undefined} value - 判定対象（data 属性の値など）
 * @returns {boolean} 対応ページであれば true
 */
export const isPreviewPage = (value: string | undefined): value is PreviewPage =>
  (PREVIEW_PAGES as readonly (string | undefined)[]).includes(value)

/**
 * @function toPreviewFallbackPath
 * @description クエリが無い・不正なプレビュー URL のリダイレクト先（公開中のページ）を返す
 * @param {PreviewPage} page - プレビューのページの種類
 * @param {Locale} locale - 表示ロケール
 * @returns {string} 公開ページのパス（例: '/en/about/'）
 */
export const toPreviewFallbackPath = (page: PreviewPage, locale: Locale): string =>
  localizePath(FALLBACK_ROUTES[page], locale)

/**
 * @function readPreviewToken
 * @description クエリパラメータから値を 1 つ取り出し、形式を検証する
 * @param {URLSearchParams} searchParams - URL のクエリ
 * @param {string} name - パラメータ名
 * @returns {string | null} 形式が正しい値。未指定・不正な場合は null
 */
const readPreviewToken = (searchParams: URLSearchParams, name: string): string | null => {
  const value = searchParams.get(name)
  return value !== null && PREVIEW_TOKEN_PATTERN.test(value) ? value : null
}

/**
 * @function parseDraftParams
 * @description TOP / About のプレビュー URL から draftKey を取り出す
 * @param {URLSearchParams} searchParams - URL のクエリ
 * @returns {DraftParams | null} 取得に使う値。draftKey が未指定・不正な場合は null
 */
export const parseDraftParams = (searchParams: URLSearchParams): DraftParams | null => {
  const draftKey = readPreviewToken(searchParams, PREVIEW_PARAM.draftKey)
  return draftKey === null ? null : { draftKey }
}

/**
 * @function parseDraftProjectParams
 * @description Project 詳細のプレビュー URL から contentId と draftKey を取り出す
 * @param {URLSearchParams} searchParams - URL のクエリ
 * @returns {DraftProjectParams | null} 取得に使う値。どちらかが未指定・不正な場合は null
 */
export const parseDraftProjectParams = (
  searchParams: URLSearchParams
): DraftProjectParams | null => {
  const draft = parseDraftParams(searchParams)
  const contentId = readPreviewToken(searchParams, PREVIEW_PARAM.contentId)
  return draft === null || contentId === null ? null : { ...draft, contentId }
}

/**
 * @function toPreviewQuery
 * @description 検証済みの値からプレビュー URL のクエリ文字列を組み立てる。
 *              言語切り替えのリンクに付け、切り替え先でも同じ下書きを表示できるようにする。
 * @param {DraftParams | DraftProjectParams} params - 検証済みの値
 * @returns {string} 先頭に `?` を付けたクエリ文字列（例: '?draftKey=xxx'）
 */
export const toPreviewQuery = (params: DraftParams | DraftProjectParams): string =>
  `?${new URLSearchParams(Object.entries(params)).toString()}`

/**
 * HTTP ステータスの 4xx の範囲。
 * microCMS はコンテンツ ID が存在しないとき 404 を返す。
 * なお、draftKey が誤っている・期限切れの場合はエラーにならず、公開中の内容が返る（microCMS の仕様）。
 */
const CLIENT_ERROR_MIN = 400
const CLIENT_ERROR_MAX = 499

/** 取得できた下書きと、その取得に使った値 */
export interface ResolvedDraft<P, T> {
  params: P
  content: T
}

/**
 * @function isClientError
 * @description microCMS が 4xx を返したエラーかどうかを判定する
 * @param {unknown} error - 捕捉したエラー
 * @returns {boolean} 4xx の MicrocmsHttpError であれば true
 */
const isClientError = (error: unknown): boolean =>
  error instanceof MicrocmsHttpError &&
  error.status >= CLIENT_ERROR_MIN &&
  error.status <= CLIENT_ERROR_MAX

/**
 * @function resolveDraft
 * @description 検証済みの値で下書きを取得する。
 *              コンテンツ ID 違いなどで microCMS が 4xx を返した場合は null を返し、
 *              呼び出し側で「見つからない」旨を表示する（障害と区別して編集者に伝えるため）。
 *              それ以外の失敗（microCMS の障害・通信エラーなど）はそのまま投げる。
 * @param {P} params - parseDraftParams / parseDraftProjectParams で検証済みの値
 * @param {(params: P) => Promise<T>} load - 下書きの取得処理
 * @returns {Promise<ResolvedDraft<P, T> | null>} 取得結果と取得に使った値。対象が見つからない場合は null
 */
export const resolveDraft = async <P, T>(
  params: P,
  load: (params: P) => Promise<T>
): Promise<ResolvedDraft<P, T> | null> => {
  try {
    return { params, content: await load(params) }
  } catch (error) {
    if (isClientError(error)) {
      return null
    }
    throw error
  }
}
