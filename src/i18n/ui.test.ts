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

  it('デザインどおり TOP の文言は jp / en 共通である', () => {
    const ja = useTranslations('ja')
    const en = useTranslations('en')
    expect(ja('top.role')).toBe(en('top.role'))
    expect(ja('top.disciplines')).toBe(en('top.disciplines'))
    expect(ja('nav.projects')).toBe(en('nav.projects'))
    expect(ja('nav.about')).toBe(en('nav.about'))
    expect(ja('projects.headerLabel')).toBe(en('projects.headerLabel'))
    expect(ja('project.headerLabel')).toBe(en('project.headerLabel'))
  })

  it('全ロケールで画像の代替テキストと支援技術向けラベルが空でない', () => {
    for (const locale of LOCALES) {
      const t = useTranslations(locale)
      expect(t('top.slideAlt').length).toBeGreaterThan(0)
      expect(t('about.photoAlt').length).toBeGreaterThan(0)
      expect(t('a11y.menu').length).toBeGreaterThan(0)
      expect(t('project.textLabel').length).toBeGreaterThan(0)
    }
  })

  it('全ロケールでコピー完了メッセージが空でない', () => {
    for (const locale of LOCALES) {
      expect(useTranslations(locale)('contact.copied').length).toBeGreaterThan(0)
    }
  })
})
