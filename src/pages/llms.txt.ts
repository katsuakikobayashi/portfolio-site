import type { APIRoute } from 'astro'
import { SITE, parseDisciplines } from '@/data/site'
import { useTranslations } from '@/i18n/ui'
import { getProjects } from '@/lib/microcms'
import { toProjectPath } from '@/lib/project'

/**
 * @function GET
 * @description llms.txt（https://llmstxt.org/ 準拠）を生成する。
 *              LLM/AI エージェントがサイト構造を把握しやすいよう、
 *              各ページの URL と役割を Markdown で列挙する。
 * @param {object} context - Astro のエンドポイントコンテキスト
 * @returns {Response} text/markdown の llms.txt レスポンス
 */
export const GET: APIRoute = async ({ site }) => {
  const en = useTranslations('en')
  const base = new URL('/', site).href.replace(/\/$/, '')
  const projects = await getProjects()
  // 説明・年は任意項目のため、入力されているものだけを「: 説明 (年)」の形で添える
  const projectLines = projects.map((project) => {
    const details = [project.description, project.year && `(${project.year})`]
      .filter(Boolean)
      .join(' ')
    const href = `${base}${toProjectPath(project.slug, 'en')}`
    return `- [${project.title}](${href})${details ? `: ${details}` : ''}`
  })

  const lines = [
    `# ${SITE.name}`,
    '',
    `> ${en('meta.description')}. Works across ${parseDisciplines(en('top.disciplines')).join(', ').toLowerCase()}.`,
    '',
    '## Pages',
    '',
    `- [Home (Japanese)](${base}/): Name, role, project photos, and contact links.`,
    `- [Home (English)](${base}/en/): Name, role, project photos, and contact links.`,
    `- [About (Japanese)](${base}/about/): Profile and background.`,
    `- [About (English)](${base}/en/about/): Profile and background.`,
    `- [Projects (Japanese)](${base}/projects/): List of projects, newest first.`,
    `- [Projects (English)](${base}/en/projects/): List of projects, newest first.`,
    '',
    '## Projects',
    '',
    ...projectLines,
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
