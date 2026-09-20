import type { APIRoute } from 'astro'
import { SITE } from '@/data/site'
import { useTranslations } from '@/i18n/ui'

/**
 * @function GET
 * @description llms.txt（https://llmstxt.org/ 準拠）を生成する。
 *              LLM/AI エージェントがサイト構造を把握しやすいよう、
 *              各ページの URL と役割を Markdown で列挙する。
 * @param {object} context - Astro のエンドポイントコンテキスト
 * @returns {Response} text/markdown の llms.txt レスポンス
 */
export const GET: APIRoute = ({ site }) => {
  const en = useTranslations('en')
  const base = new URL('/', site).href.replace(/\/$/, '')

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${en('meta.description')}. Works across ${en('top.disciplines').toLowerCase()}.`,
    '',
    '## Pages',
    '',
    `- [Home (Japanese)](${base}/): Name, role, and contact links.`,
    `- [Home (English)](${base}/en/): Name, role, and contact links.`,
    `- [About (Japanese)](${base}/about/): Profile and background.`,
    `- [About (English)](${base}/en/about/): Profile and background.`,
    '',
    '## Contact',
    '',
    `- Email: ${SITE.email}`,
    `- Instagram: ${SITE.instagramUrl}`,
    '',
  ]

  return new Response(lines.join('\n'), {
    // 静的出力後は Netlify が拡張子ベースで Content-Type を決定するため
    // （.txt -> text/plain）、robots.txt と同様に text/plain を返す。
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
