import type { APIRoute } from 'astro'

/**
 * @function GET
 * @description robots.txt を生成する。Sitemap の URL は astro.config.mjs の site 設定に追従させる。
 * @param {object} context - Astro のエンドポイントコンテキスト
 * @returns {Response} text/plain の robots.txt レスポンス
 */
export const GET: APIRoute = ({ site }) => {
  const sitemapUrl = new URL('sitemap-index.xml', site).href
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
