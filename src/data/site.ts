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

/**
 * @function formatCopyright
 * @description フッターに表示するコピーライト表記を生成する
 * @param {number} year - 表示する年（ビルド時の西暦）
 * @param {string} holder - 権利者名
 * @returns {string} 「© 2026 Katsuaki Kobayashi」形式の文字列
 */
export const formatCopyright = (year: number, holder: string): string => `© ${year} ${holder}`
