import type { APIRoute } from 'astro'
import { PREVIEW_ROUTE } from '@/data/site'
import { LOCALES } from '@/i18n/config'
import { localizePath } from '@/i18n/utils'

/** 下書きプレビューのパス（ロケールごと。例: '/preview/', '/en/preview/'） */
const PREVIEW_PATHS = LOCALES.map((locale) => localizePath(PREVIEW_ROUTE, locale))

/**
 * @function GET
 * @description robots.txt を生成する。Sitemap の URL は astro.config.mjs の site 設定に追従させる。
 * @param {object} context - Astro のエンドポイントコンテキスト
 * @returns {Response} text/plain の robots.txt レスポンス
 */
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site).href
  // 下書きプレビューは draftKey が無いと表示されないが、クロール自体も不要なため除外する
  const disallow = PREVIEW_PATHS.map((path) => `Disallow: ${path}\n`).join('')
  const body = `User-agent: *\nAllow: /\n${disallow}\nSitemap: ${sitemapUrl}\n`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
