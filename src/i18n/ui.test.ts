import { describe, expect, it } from 'vitest'
import { LOCALES } from './config'
import { useTranslations } from './ui'

describe('useTranslations', () => {
  it('日本語ロケールの文言を返す', () => {
    const t = useTranslations('ja')
    expect(t('meta.title')).toBe('Katsuaki Kobayashi')
    expect(t('a11y.languageNav')).toBe('言語切り替え')
  })

  it('英語ロケールの文言を返す', () => {
    const t = useTranslations('en')
    expect(t('a11y.languageNav')).toBe('Language')
  })

  it('原稿どおり TOP の文言は jp / en 共通である', () => {
    const ja = useTranslations('ja')
    const en = useTranslations('en')
    expect(ja('top.role')).toBe(en('top.role'))
    expect(ja('top.disciplines')).toBe(en('top.disciplines'))
    expect(ja('meta.description')).toBe(en('meta.description'))
  })

  it('全ロケールで About の氏名と第 1 段落が空でない', () => {
    for (const locale of LOCALES) {
      const t = useTranslations(locale)
      expect(t('about.name').length).toBeGreaterThan(0)
      expect(t('about.paragraph1').length).toBeGreaterThan(0)
    }
  })

  it('全ロケールで About は 2 段落構成である', () => {
    for (const locale of LOCALES) {
      expect(useTranslations(locale)('about.paragraph2').length).toBeGreaterThan(0)
    }
  })

  it('About の段落は指示どおりの行数で改行される', () => {
    expect(useTranslations('ja')('about.paragraph1').split('\n')).toHaveLength(3)
    expect(useTranslations('ja')('about.paragraph2').split('\n')).toHaveLength(2)
    expect(useTranslations('en')('about.paragraph1').split('\n')).toHaveLength(5)
    expect(useTranslations('en')('about.paragraph2').split('\n')).toHaveLength(3)
  })

  it('全ロケールでコピー完了メッセージが空でない', () => {
    for (const locale of LOCALES) {
      expect(useTranslations(locale)('contact.copied').length).toBeGreaterThan(0)
    }
  })
})
