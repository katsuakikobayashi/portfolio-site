import { describe, expect, it } from 'vitest'
import { SITE, formatCopyright, parseDisciplines } from './site'

describe('formatCopyright', () => {
  it('デザイン指定どおりの表記を生成する', () => {
    expect(formatCopyright(2026)).toBe('©2026')
  })

  it('年が変わっても表記形式を維持する', () => {
    expect(formatCopyright(2030)).toBe('©2030')
  })
})

describe('parseDisciplines', () => {
  it('スラッシュ区切りの分野を配列にし、末尾の省略記号を除く', () => {
    expect(parseDisciplines('Product / Select / Graphic / Photography ...')).toEqual([
      'Product',
      'Select',
      'Graphic',
      'Photography',
    ])
  })

  it('全角の三点リーダーも省略記号として扱う', () => {
    expect(parseDisciplines('Product / Graphic…')).toEqual(['Product', 'Graphic'])
  })

  it('省略記号がなくても分解できる', () => {
    expect(parseDisciplines('Product / Graphic')).toEqual(['Product', 'Graphic'])
  })
})

describe('SITE', () => {
  it('メールアドレスがデザイン指定と一致する', () => {
    expect(SITE.email).toBe('info@katsuakikobayashi.com')
  })

  it('OGP 画像は 1200x630 で定義されている', () => {
    expect(SITE.ogImageWidth).toBe(1200)
    expect(SITE.ogImageHeight).toBe(630)
  })
})
