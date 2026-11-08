import { describe, expect, it, vi } from 'vitest'
import {
  LIST_LIMIT_MAX,
  createMicrocmsClient,
  fetchAllProjectContents,
  resolveMicrocmsBaseUrl,
  type FetchLike,
} from './client'

describe('resolveMicrocmsBaseUrl', () => {
  it('サービスドメインのみの指定からベース URL を組み立てる', () => {
    expect(resolveMicrocmsBaseUrl('example')).toBe('https://example.microcms.io')
  })

  it('URL 形式（末尾スラッシュ付き）の指定を受け付ける', () => {
    expect(resolveMicrocmsBaseUrl('https://example.microcms.io/')).toBe(
      'https://example.microcms.io'
    )
  })

  it('前後の空白を無視する', () => {
    expect(resolveMicrocmsBaseUrl('  example  ')).toBe('https://example.microcms.io')
  })

  it('空文字はエラーにする', () => {
    expect(() => resolveMicrocmsBaseUrl('')).toThrow('MICROCMS_DOMAIN')
  })

  it('microCMS 以外のホストへ API キーを送らない', () => {
    expect(() => resolveMicrocmsBaseUrl('https://evil.example.com/')).toThrow()
    expect(() => resolveMicrocmsBaseUrl('http://example.microcms.io/')).toThrow()
  })
})

describe('createMicrocmsClient', () => {
  const config = { serviceDomain: 'example', apiKey: 'test-key' }

  it('API キーをヘッダーに付けてエンドポイントを GET する', async () => {
    const body = { name: '小林 克彰' }
    const fetchFn = vi.fn<FetchLike>().mockResolvedValue(Response.json(body))

    const result = await createMicrocmsClient(config, fetchFn).get('about')

    expect(result).toEqual(body)
    expect(fetchFn).toHaveBeenCalledWith('https://example.microcms.io/api/v1/about', {
      headers: { 'X-MICROCMS-API-KEY': 'test-key' },
    })
  })

  it('クエリパラメータを URL エンコードして付与する', async () => {
    const fetchFn = vi.fn<FetchLike>().mockResolvedValue(Response.json({ contents: [] }))

    await createMicrocmsClient(config, fetchFn).get('projects', {
      orders: '-publishedAt',
      filters: 'url[equals]a&b',
    })

    const [requested] = fetchFn.mock.calls[0] ?? []
    const url = new URL(requested ?? '')
    expect(url.pathname).toBe('/api/v1/projects')
    expect(url.searchParams.get('orders')).toBe('-publishedAt')
    expect(url.searchParams.get('filters')).toBe('url[equals]a&b')
  })

  it('HTTP エラー時はステータスを含むエラーを投げる', async () => {
    const fetchFn = vi.fn<FetchLike>().mockResolvedValue(new Response(null, { status: 401 }))

    await expect(createMicrocmsClient(config, fetchFn).get('top')).rejects.toThrow('top (401)')
  })

  it('API キーが空の場合は生成時にエラーにする', () => {
    expect(() => createMicrocmsClient({ ...config, apiKey: ' ' })).toThrow('MICROCMS_API_KEY')
  })
})

describe('fetchAllProjectContents', () => {
  const config = { serviceDomain: 'example', apiKey: 'test-key' }

  /**
   * @function respondByOffset
   * @description offset ごとに 1 件ずつ返すリスト API のモックを作る
   * @param {number} totalCount - 全件数
   * @returns {FetchLike} モックの fetch
   */
  const respondByOffset =
    (totalCount: number): FetchLike =>
    (input) => {
      const offset = new URL(input).searchParams.get('offset') ?? '0'
      return Promise.resolve(Response.json({ contents: [{ id: offset }], totalCount }))
    }

  it('上限件数以内なら 1 リクエストで取得する', async () => {
    const fetchFn = vi.fn<FetchLike>(respondByOffset(1))
    const contents = await fetchAllProjectContents(createMicrocmsClient(config, fetchFn).get)
    expect(contents).toEqual([{ id: '0' }])
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('上限件数を超える場合は offset を指定して残りを取得し、順番どおりに連結する', async () => {
    const fetchFn = vi.fn<FetchLike>(respondByOffset(LIST_LIMIT_MAX * 2 + 1))
    const contents = await fetchAllProjectContents(createMicrocmsClient(config, fetchFn).get)
    expect(contents).toEqual([
      { id: '0' },
      { id: String(LIST_LIMIT_MAX) },
      { id: String(LIST_LIMIT_MAX * 2) },
    ])
    const [firstUrl] = fetchFn.mock.calls[0] ?? []
    expect(new URL(firstUrl ?? '').searchParams.get('orders')).toBe('-publishedAt')
  })
})
