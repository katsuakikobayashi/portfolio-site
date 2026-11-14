import { describe, expect, it } from 'vitest'
import { getAlternatePath, getLocaleFromPath, getRouteKey, isLocale, localizePath } from './utils'

describe('isLocale', () => {
  it('対応ロケールを受け入れる', () => {
    expect(isLocale('ja')).toBe(true)
    expect(isLocale('en')).toBe(true)
  })

  it('未対応の値を拒否する', () => {
    expect(isLocale('fr')).toBe(false)
    expect(isLocale('jp')).toBe(false)
    expect(isLocale('')).toBe(false)
  })
})

describe('getRouteKey', () => {
  it('既定ロケールの TOP は空文字を返す', () => {
    expect(getRouteKey('/')).toBe('')
  })

  it('英語版 TOP はロケールを除いて空文字を返す', () => {
    expect(getRouteKey('/en/')).toBe('')
  })

  it('下層ページのルート識別子を取り出す', () => {
    expect(getRouteKey('/about/')).toBe('about')
    expect(getRouteKey('/en/about/')).toBe('about')
  })

  it('末尾スラッシュの有無に依存しない', () => {
    expect(getRouteKey('/en/about')).toBe('about')
  })

  it('ネストしたパスを保持する', () => {
    expect(getRouteKey('/en/works/chair/')).toBe('works/chair')
  })
})

describe('getLocaleFromPath', () => {
  it('プレフィックスがなければ既定ロケールを返す', () => {
    expect(getLocaleFromPath('/')).toBe('ja')
    expect(getLocaleFromPath('/about/')).toBe('ja')
  })

  it('en プレフィックスを認識する', () => {
    expect(getLocaleFromPath('/en/')).toBe('en')
    expect(getLocaleFromPath('/en/about/')).toBe('en')
  })

  it('ロケールに似た先頭セグメントを誤認しない', () => {
    expect(getLocaleFromPath('/energy/')).toBe('ja')
  })
})

describe('localizePath', () => {
  it('既定ロケールの TOP はルートパスを返す', () => {
    expect(localizePath('', 'ja')).toBe('/')
  })

  it('英語版 TOP はロケールプレフィックスのみを持つ', () => {
    expect(localizePath('', 'en')).toBe('/en/')
  })

  it('下層ページに末尾スラッシュを付与する', () => {
    expect(localizePath('about', 'ja')).toBe('/about/')
    expect(localizePath('about', 'en')).toBe('/en/about/')
  })

  it('前後のスラッシュを正規化する', () => {
    expect(localizePath('/about/', 'en')).toBe('/en/about/')
  })
})

describe('getAlternatePath', () => {
  it('TOP の言語間を相互に変換する', () => {
    expect(getAlternatePath('/', 'en')).toBe('/en/')
    expect(getAlternatePath('/en/', 'ja')).toBe('/')
  })

  it('下層ページでも同一ページの別言語版を指す', () => {
    expect(getAlternatePath('/about/', 'en')).toBe('/en/about/')
    expect(getAlternatePath('/en/about/', 'ja')).toBe('/about/')
  })

  it('同一ロケールを指定した場合は現在のパスと一致する', () => {
    expect(getAlternatePath('/en/about/', 'en')).toBe('/en/about/')
  })
})
