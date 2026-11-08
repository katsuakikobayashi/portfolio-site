import type { MicrocmsEndpoint, MicrocmsEndpoints } from './types'

/** microCMS クライアントの接続設定 */
export interface MicrocmsConfig {
  /** サービスドメイン（`xxx`）またはサービス URL（`https://xxx.microcms.io/`） */
  serviceDomain: string
  apiKey: string
}

/** テストで差し替えられるよう、fetch はシグネチャだけに依存する */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

/** API のクエリパラメータ（例: `{ orders: '-publishedAt', limit: '100' }`） */
export type MicrocmsQuery = Readonly<Record<string, string>>

export interface MicrocmsClient {
  get: <E extends MicrocmsEndpoint>(
    endpoint: E,
    query?: MicrocmsQuery
  ) => Promise<MicrocmsEndpoints[E]>
}

const API_VERSION_PATH = 'api/v1'

/**
 * @function resolveMicrocmsBaseUrl
 * @description 環境変数の値からサービスのベース URL を組み立てる。
 *              `.env` には URL 形式で登録されているケースがあるため、
 *              ドメイン名のみ / URL のどちらでも受け付ける。
 * @param {string} serviceDomain - サービスドメインまたはサービス URL
 * @returns {string} 末尾スラッシュなしのベース URL（例: 'https://xxx.microcms.io'）
 * @throws {Error} 空文字、または microcms.io 以外のホストを指す URL の場合
 */
export const resolveMicrocmsBaseUrl = (serviceDomain: string): string => {
  const value = serviceDomain.trim()
  if (value.length === 0) {
    throw new Error('MICROCMS_DOMAIN が設定されていません')
  }

  const url = new URL(/^https?:\/\//.test(value) ? value : `https://${value}.microcms.io`)
  // API キーを第三者のホストへ送らないよう、送信先を microCMS に限定する
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.microcms.io')) {
    throw new Error(`MICROCMS_DOMAIN が microCMS のサービス URL ではありません: ${url.origin}`)
  }
  return url.origin
}

/**
 * @function createMicrocmsClient
 * @description microCMS のコンテンツ API（GET）を呼び出すクライアントを生成する。
 *              外部 SDK を導入せず fetch のみで実装し、依存とバンドルを増やさない。
 * @param {MicrocmsConfig} config - 接続設定
 * @param {FetchLike} fetchFn - HTTP クライアント（既定はグローバルの fetch）
 * @returns {MicrocmsClient} エンドポイント名（と任意のクエリ）からコンテンツを取得する get 関数を持つオブジェクト
 */
export const createMicrocmsClient = (
  config: MicrocmsConfig,
  fetchFn: FetchLike = fetch
): MicrocmsClient => {
  if (config.apiKey.trim().length === 0) {
    throw new Error('MICROCMS_API_KEY が設定されていません')
  }
  const baseUrl = resolveMicrocmsBaseUrl(config.serviceDomain)

  return {
    get: async <E extends MicrocmsEndpoint>(
      endpoint: E,
      query: MicrocmsQuery = {}
    ): Promise<MicrocmsEndpoints[E]> => {
      const url = new URL(`${baseUrl}/${API_VERSION_PATH}/${endpoint}`)
      // URLSearchParams 経由で値をエンコードし、クエリ文字列の組み立てミスを防ぐ
      Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value))
      const response = await fetchFn(url.href, {
        headers: { 'X-MICROCMS-API-KEY': config.apiKey },
      })
      if (!response.ok) {
        // 取得失敗時に空のページを公開しないよう、ビルドごと失敗させる
        throw new Error(`microCMS の取得に失敗しました: ${endpoint} (${response.status})`)
      }
      // レスポンス形状は管理画面のスキーマで保証される前提（types.ts と同期させること）
      return (await response.json()) as MicrocmsEndpoints[E]
    },
  }
}
