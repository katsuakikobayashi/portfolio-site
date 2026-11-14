import { describe, expect, it, vi } from 'vitest'
import { MicrocmsHttpError } from '@/lib/microcms/client'
import {
  PREVIEW_PAGES,
  isPreviewPage,
  parseDraftParams,
  parseDraftProjectParams,
  resolveDraft,
  toPreviewFallbackPath,
  toPreviewQuery,
} from './preview'

describe('isPreviewPage', () => {
  it('対応ページの種類だけを受け付ける', () => {
    PREVIEW_PAGES.forEach((page) => expect(isPreviewPage(page)).toBe(true))
    expect(isPreviewPage('projects')).toBe(false)
    expect(isPreviewPage(undefined)).toBe(false)
  })
})

describe('toPreviewFallbackPath', () => {
  it('クエリが無いときの移動先として、公開中の同じページを返す', () => {
    expect(toPreviewFallbackPath('top', 'ja')).toBe('/')
    expect(toPreviewFallbackPath('about', 'ja')).toBe('/about/')
    expect(toPreviewFallbackPath('top', 'en')).toBe('/en/')
    expect(toPreviewFallbackPath('about', 'en')).toBe('/en/about/')
  })

  it('Project はコンテンツを特定できないため一覧へ移動させる', () => {
    expect(toPreviewFallbackPath('project', 'ja')).toBe('/projects/')
    expect(toPreviewFallbackPath('project', 'en')).toBe('/en/projects/')
  })
})

describe('parseDraftParams', () => {
  it('draftKey を取り出す', () => {
    expect(parseDraftParams(new URLSearchParams('draftKey=Ab_3-x'))).toEqual({
      draftKey: 'Ab_3-x',
    })
  })

  it('draftKey が無い・空の場合は null', () => {
    expect(parseDraftParams(new URLSearchParams(''))).toBeNull()
    expect(parseDraftParams(new URLSearchParams('draftKey='))).toBeNull()
  })

  it('英数字・-・_ 以外を含む値は null（パス・クエリの注入を防ぐ）', () => {
    expect(parseDraftParams(new URLSearchParams('draftKey=..%2Fabout'))).toBeNull()
    expect(parseDraftParams(new URLSearchParams('draftKey=a%26limit%3D1'))).toBeNull()
    expect(parseDraftParams(new URLSearchParams('draftKey=%3Cscript%3E'))).toBeNull()
  })

  it('長さの上限（100 文字）を超える値は null', () => {
    expect(parseDraftParams(new URLSearchParams(`draftKey=${'a'.repeat(100)}`))).not.toBeNull()
    expect(parseDraftParams(new URLSearchParams(`draftKey=${'a'.repeat(101)}`))).toBeNull()
  })
})

describe('parseDraftProjectParams', () => {
  it('contentId と draftKey を取り出す', () => {
    expect(parseDraftProjectParams(new URLSearchParams('contentId=abc&draftKey=key'))).toEqual({
      contentId: 'abc',
      draftKey: 'key',
    })
  })

  it('どちらかが無い・不正な場合は null', () => {
    expect(parseDraftProjectParams(new URLSearchParams('draftKey=key'))).toBeNull()
    expect(parseDraftProjectParams(new URLSearchParams('contentId=abc'))).toBeNull()
    expect(parseDraftProjectParams(new URLSearchParams('contentId=..&draftKey=key'))).toBeNull()
  })
})

describe('toPreviewQuery', () => {
  it('検証済みの値からクエリ文字列を組み立てる', () => {
    expect(toPreviewQuery({ draftKey: 'key' })).toBe('?draftKey=key')
    expect(toPreviewQuery({ draftKey: 'key', contentId: 'abc' })).toBe(
      '?draftKey=key&contentId=abc'
    )
  })
})

describe('resolveDraft', () => {
  it('取得結果と取得に使った値を返す', async () => {
    const params = { draftKey: 'key' }
    const load = vi.fn().mockResolvedValue({ name: 'draft' })

    await expect(resolveDraft(params, load)).resolves.toEqual({
      params,
      content: { name: 'draft' },
    })
    expect(load).toHaveBeenCalledWith(params)
  })

  it('microCMS が 4xx を返した場合（draftKey 違いなど）は null を返す', async () => {
    const load = vi.fn().mockRejectedValue(new MicrocmsHttpError('top', 404))
    await expect(resolveDraft({ draftKey: 'key' }, load)).resolves.toBeNull()
  })

  it('microCMS の障害（5xx）やその他のエラーはそのまま投げる', async () => {
    const serverError = new MicrocmsHttpError('top', 500)
    await expect(
      resolveDraft({ draftKey: 'key' }, vi.fn().mockRejectedValue(serverError))
    ).rejects.toBe(serverError)

    const unexpected = new Error('unexpected')
    await expect(
      resolveDraft({ draftKey: 'key' }, vi.fn().mockRejectedValue(unexpected))
    ).rejects.toBe(unexpected)
  })
})
