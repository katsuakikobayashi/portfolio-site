/**
 * サイト共通の定数。文言以外の外部リンク・識別情報をここに集約する。
 */
export const SITE = {
  name: 'Katsuaki Kobayashi',
  email: 'info@katsuakikobayashi.com',
  /** TODO: 実アカウントの URL を確認のうえ差し替えること */
  instagramUrl: 'https://www.instagram.com/katsuaki_kobayashi_/',
  ogImagePath: '/ogp.png',
  ogImageWidth: 1200,
  ogImageHeight: 630,
} as const

/** ページのルート識別子（i18n/utils の localizePath に渡す値） */
export const ROUTES = {
  top: '',
  about: 'about',
  projects: 'projects',
} as const

export type RouteName = keyof typeof ROUTES

/**
 * @function formatCopyright
 * @description フッターに表示するコピーライト表記を生成する
 * @param {number} year - 表示する年（ビルド時の西暦）
 * @returns {string} 「©2026」形式の文字列
 */
export const formatCopyright = (year: number): string => `©${year}`

/** 分野の列挙に付く「続きがある」ことを示す省略記号（表示専用） */
const TRAILING_ELLIPSIS = /\s*(\.\.\.|…)$/

/**
 * @function parseDisciplines
 * @description 「Product / Select / Graphic / Photography ...」形式の文言を分野の配列に分解する。
 *              表示用の末尾の省略記号は構造化データに不要なため取り除く。
 * @param {string} disciplines - スラッシュ区切りの分野文言
 * @returns {string[]} 分野名の配列
 */
export const parseDisciplines = (disciplines: string): string[] =>
  disciplines
    .replace(TRAILING_ELLIPSIS, '')
    .split('/')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
