import { describe, expect, it, vi } from 'vitest'
import { dictionary } from '../i18n/ui'
import type { FetchLike } from './microcms/client'
import {
  MARKUP_SYMBOLS,
  collectStrings,
  fetchSiteGlyphs,
  getStaticTexts,
  toGlyphs,
} from './font-glyphs'

describe('collectStrings', () => {
  it('ネストしたオブジェクト・配列から文字列だけを取り出す', () => {
    const value = {
      title: '住宅',
      images: [{ url: 'a', width: 1 }],
      meta: null,
      nested: { x: '庭' },
    }
    expect(collectStrings(value)).toEqual(['住宅', 'a', '庭'])
  })

  it('文字列以外のプリミティブは無視する', () => {
    expect(collectStrings([1, true, undefined, null])).toEqual([])
  })
})

describe('toGlyphs', () => {
  it('重複を除き、コードポイント順に並べる', () => {
    expect(toGlyphs(['あいあ', 'Aい'])).toEqual(['A', 'あ', 'い'])
  })

  it('空白・改行を除外する', () => {
    expect(toGlyphs(['a b\n　c'])).toEqual(['a', 'b', 'c'])
  })

  it('サロゲートペアの文字を 1 文字として扱う', () => {
    expect(toGlyphs(['𠮷野'])).toEqual(['野', '𠮷'])
  })
})

describe('getStaticTexts', () => {
  it('UI 辞書の文言とマークアップの記号を含む', () => {
    const texts = getStaticTexts()
    expect(texts).toEqual(expect.arrayContaining(Object.values(dictionary.ja)))
    expect(texts).toEqual(expect.arrayContaining([...MARKUP_SYMBOLS]))
  })
})

describe('fetchSiteGlyphs', () => {
  it('UI 文言と microCMS の全エンドポイントの文字をまとめて返す', async () => {
    const responses: Record<string, unknown> = {
      top: { sliderImages: [] },
      about: { name: '小林', text: '設計' },
      projects: { contents: [{ title: '砧の家', body: '<p>庭</p>' }], totalCount: 1 },
    }
    const fetchFn = vi.fn<FetchLike>((input) => {
      const endpoint = new URL(input).pathname.split('/').at(-1) ?? ''
      return Promise.resolve(new Response(JSON.stringify(responses[endpoint])))
    })
    const glyphs = await fetchSiteGlyphs({ serviceDomain: 'example', apiKey: 'key' }, fetchFn)
    expect(glyphs).toEqual(expect.arrayContaining(['小', '林', '設', '計', '砧', '家', '庭']))
    expect(glyphs).toEqual(expect.arrayContaining(toGlyphs(getStaticTexts())))
    expect(fetchFn).toHaveBeenCalledTimes(3)
  })
})
