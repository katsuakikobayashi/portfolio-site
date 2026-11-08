import type { Locale } from './config'

/**
 * 画面表示文言の辞書（UI の固定文言のみ）。
 * About の氏名・本文・写真は microCMS（エンドポイント `about`）、
 * Projects の内容は microCMS（エンドポイント `projects`）で管理する。
 */
const dictionary = {
  ja: {
    'meta.title': 'Katsuaki Kobayashi',
    'meta.description': 'Designer based in Tokyo, Japan',
    'top.role': 'Designer',
    'top.disciplines': 'Product / Select / Graphic / Photography ...',
    'top.slideAlt': 'Katsuaki Kobayashi のプロジェクト写真',
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
  },
  en: {
    'meta.title': 'Katsuaki Kobayashi',
    'meta.description': 'Designer based in Tokyo, Japan',
    'top.role': 'Designer',
    'top.disciplines': 'Product / Select / Graphic / Photography ...',
    'top.slideAlt': 'Project photo by Katsuaki Kobayashi',
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
