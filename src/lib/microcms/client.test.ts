import { describe, expect, it, vi } from 'vitest'
import { createMicrocmsClient, resolveMicrocmsBaseUrl, type FetchLike } from './client'

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
