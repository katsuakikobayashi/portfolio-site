import { MICROCMS_API_KEY, MICROCMS_DOMAIN } from 'astro:env/server'
import { toProjects, type Project } from '@/lib/project'
import { createMicrocmsClient, type MicrocmsQuery } from './client'
import type { MicrocmsEndpoint, MicrocmsEndpoints, ProjectContent } from './types'

export type { AboutContent, MicrocmsImage, ProjectContent, TopContent } from './types'

const client = createMicrocmsClient({ serviceDomain: MICROCMS_DOMAIN, apiKey: MICROCMS_API_KEY })

/**
 * ビルド中のみ使うレスポンスキャッシュ（キーはエンドポイント + クエリ）。
 * 本番ビルドでは ja / en や一覧 / 詳細の複数ページが同じリクエストを参照するため、
 * 1 ビルドにつき同一リクエストは 1 回に抑える。
 * ローカル dev（import.meta.env.DEV）では CMS の更新を即時に確認できるよう、
 * キャッシュせずリクエストのたびに取得する。
 */
const buildCache = new Map<string, Promise<unknown>>()

/**
 * @function toCacheKey
 * @description エンドポイントとクエリからキャッシュキーを作る。
 *              クエリの記述順が違っても同じキーになるよう、キーで並べ替えてから連結する。
 * @param {MicrocmsEndpoint} endpoint - エンドポイント名
 * @param {MicrocmsQuery} query - クエリパラメータ
 * @returns {string} キャッシュキー
 */
const toCacheKey = (endpoint: MicrocmsEndpoint, query: MicrocmsQuery): string =>
  [
    endpoint,
    new URLSearchParams(
      Object.entries(query).toSorted(([a], [b]) => a.localeCompare(b))
    ).toString(),
  ].join('?')

/**
 * @function getContent
 * @description microCMS の API からコンテンツを取得する
 * @param {MicrocmsEndpoint} endpoint - エンドポイント名（'top' | 'about' | 'projects'）
 * @param {MicrocmsQuery} query - クエリパラメータ（リスト形式の並び順・件数など）
 * @returns {Promise<MicrocmsEndpoints[E]>} エンドポイントに対応するコンテンツ
 */
export const getContent = <E extends MicrocmsEndpoint>(
  endpoint: E,
  query: MicrocmsQuery = {}
): Promise<MicrocmsEndpoints[E]> => {
  if (import.meta.env.DEV) {
    return client.get(endpoint, query)
  }

  const key = toCacheKey(endpoint, query)
  const cached = buildCache.get(key)
  if (cached) {
    return cached as Promise<MicrocmsEndpoints[E]>
  }
  const request = client.get(endpoint, query)
  buildCache.set(key, request)
  return request
}

/** microCMS リスト形式 API の 1 リクエストあたりの最大取得件数 */
const LIST_LIMIT_MAX = 100

/** Projects は公開日の新しい順に並べる（デザイン指定） */
const PROJECTS_ORDER = '-publishedAt'

/**
 * @function getAllProjectContents
 * @description microCMS `projects` の全件を公開日の新しい順に取得する。
 *              1 リクエストの上限（100 件）を超える場合は、残りを offset 指定で並列に取得して連結する。
 * @returns {Promise<ProjectContent[]>} 全件のコンテンツ
 */
const getAllProjectContents = async (): Promise<ProjectContent[]> => {
  const query = { orders: PROJECTS_ORDER, limit: String(LIST_LIMIT_MAX) }
  const first = await getContent('projects', query)
  const restOffsets = Array.from(
    { length: Math.max(0, Math.ceil(first.totalCount / LIST_LIMIT_MAX) - 1) },
    (_, i) => (i + 1) * LIST_LIMIT_MAX
  )
  const rest = await Promise.all(
    restOffsets.map((offset) => getContent('projects', { ...query, offset: String(offset) }))
  )
  return [first, ...rest].flatMap((page) => page.contents)
}

/**
 * @function getProjects
 * @description Projects の全件を取得し、ページ用の形に変換する（公開日の新しい順）
 * @returns {Promise<Project[]>} ページ用のプロジェクト一覧
 * @throws {Error} url が不正・重複している場合（ビルドを止める）
 */
export const getProjects = async (): Promise<Project[]> => toProjects(await getAllProjectContents())
