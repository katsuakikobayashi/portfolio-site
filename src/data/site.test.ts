import { describe, expect, it } from 'vitest'
import { SITE, formatCopyright } from './site'

describe('formatCopyright', () => {
  it('デザイン指定どおりの表記を生成する', () => {
    expect(formatCopyright(2026, SITE.name)).toBe('© 2026 Katsuaki Kobayashi')
  })

  it('年が変わっても表記形式を維持する', () => {
    expect(formatCopyright(2030, SITE.name)).toBe('© 2030 Katsuaki Kobayashi')
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
