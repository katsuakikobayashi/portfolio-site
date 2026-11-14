import type { Locale } from './config'

/**
 * 画面表示文言の辞書（UI の固定文言のみ）。
 * About の氏名・本文・写真は microCMS（エンドポイント `about`）、
 * Projects の内容は microCMS（エンドポイント `projects`）で管理する。
 */
export const dictionary = {
  ja: {
    'meta.title': 'Katsuaki Kobayashi',
    'meta.description': 'Designer based in Tokyo, Japan',
    'top.role': 'Designer',
    'top.disciplines': 'Product / Select / Graphic / Photography ...',
    'nav.projects': 'Projects',
    'nav.about': 'About',
    'contact.heading': 'Contact',
    'contact.instagram': 'instagram',
    'contact.copied': 'Copied',
    'about.photoAlt': '小林 克彰のポートレート',
    'projects.headerLabel': 'List',
    'project.headerLabel': 'Project',
    'project.textLabel': 'プロジェクト概要',
    'a11y.siteNav': 'サイト内',
    'a11y.languageNav': '言語切り替え',
    'a11y.menu': 'メニュー',
    'preview.loading': '下書きを読み込んでいます…',
    'preview.ready': '下書きプレビュー',
    'preview.notFound': '下書きが見つかりません（コンテンツ ID を確認してください）',
    'preview.failed': '下書きを読み込めませんでした。時間をおいて再読み込みしてください',
    'preview.notConfigured': '下書きプレビューの設定がありません（API キー未設定）',
  },
  en: {
    'meta.title': 'Katsuaki Kobayashi',
    'meta.description': 'Designer based in Tokyo, Japan',
    'top.role': 'Designer',
    'top.disciplines': 'Product / Select / Graphic / Photography ...',
    'nav.projects': 'Projects',
    'nav.about': 'About',
    'contact.heading': 'Contact',
    'contact.instagram': 'instagram',
    'contact.copied': 'Copied',
    'about.photoAlt': 'Portrait of Katsuaki Kobayashi',
    'projects.headerLabel': 'List',
    'project.headerLabel': 'Project',
    'project.textLabel': 'Project details',
    'a11y.siteNav': 'Site',
    'a11y.languageNav': 'Language',
    'a11y.menu': 'Menu',
    'preview.loading': 'Loading draft…',
    'preview.ready': 'Draft preview',
    'preview.notFound': 'Draft not found (please check the content ID)',
    'preview.failed': 'Could not load the draft. Please reload later',
    'preview.notConfigured': 'Draft preview is not configured (API key missing)',
  },
} as const

export type UiKey = keyof (typeof dictionary)['ja']

/**
 * @function useTranslations
 * @description 指定ロケールの文言を引く関数を返す
 * @param {Locale} locale - 対象ロケール
 * @returns {(key: UiKey) => string} 文言キーを受け取り表示文字列を返す関数
 */
export const useTranslations =
  (locale: Locale) =>
  (key: UiKey): string =>
    dictionary[locale][key]
