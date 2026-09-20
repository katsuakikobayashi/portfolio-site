import type { Locale } from './config'

/**
 * 画面表示文言の辞書。
 * 原稿（docs/design/web text.rtf）どおり、TOP の文言は jp / en 共通。
 */
const dictionary = {
  ja: {
    'meta.title': 'Katsuaki Kobayashi',
    'meta.description': 'Designer based in Tokyo, Japan',
    'top.role': 'Designer',
    'top.disciplines': 'Product / Graphic / Photography',
    'nav.about': 'About',
    'nav.home': 'Home',
    'contact.heading': 'Contact',
    'contact.instagram': 'instagram',
    'contact.copied': 'コピーしました',
    'about.name': '小林　克彰',
    /* 改行位置は指示どおり固定（\n で明示的な改行を表す） */
    'about.paragraph1': [
      '1997年福井県生まれ。',
      '武蔵野美術大学 基礎デザイン学科を卒業後、',
      'nendo、芦沢啓治建築設計事務所を経て、2026年に独立。',
    ].join('\n'),
    'about.paragraph2': [
      '建築や空間に関わるプロダクトのデザインやセレクトを主軸に、',
      '日用品やグラフィックなど、領域を横断しながら活動している。',
    ].join('\n'),
    'a11y.pageNav': 'ページ',
    'a11y.languageNav': '言語切り替え',
  },
  en: {
    'meta.title': 'Katsuaki Kobayashi',
    'meta.description': 'Designer based in Tokyo, Japan',
    'top.role': 'Designer',
    'top.disciplines': 'Product / Graphic / Photography',
    'nav.about': 'About',
    'nav.home': 'Home',
    'contact.heading': 'Contact',
    'contact.instagram': 'instagram',
    'contact.copied': 'Copied',
    'about.name': 'Katsuaki Kobayashi',
    /* 改行位置は指示どおり固定（\n で明示的な改行を表す） */
    'about.paragraph1': [
      'Born in Fukui, Japan, in 1997.',
      'After graduating from Musashino Art University,',
      'Department of Science of Design,',
      'worked at nendo and Keiji Ashizawa Design',
      'before establishing an independent practice in 2026.',
    ].join('\n'),
    'about.paragraph2': [
      'Focusing on product design and selection',
      'for architecture and interior spaces,',
      'alongside everyday objects and graphic design.',
    ].join('\n'),
    'a11y.pageNav': 'Pages',
    'a11y.languageNav': 'Language',
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
