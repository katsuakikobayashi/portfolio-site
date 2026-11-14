import { ROUTES } from '@/data/site'
import type { Locale } from '@/i18n/config'
import { localizePath } from '@/i18n/utils'
import type { MicrocmsImage, ProjectContent } from '@/lib/microcms/types'

/**
 * microCMS `projects` のレスポンスを、ページで扱う形に整える関数群。
 * astro:env に依存しない純粋関数のみを置き、単体テストの対象にする。
 */

/** ページで扱うプロジェクト 1 件 */
export interface Project {
  id: string
  /** 詳細ページの URL スラッグ（CMS: url） */
  slug: string
  title: string
  year: string
  description: string
  thumbnail?: MicrocmsImage | undefined
  images: MicrocmsImage[]
  /** リッチテキストの HTML（CMS: body / bodyEn） */
  body: Readonly<Record<Locale, string>>
}

/**
 * URL スラッグに使える文字。
 * CMS の入力値がそのままパスになるため、パストラバーサル（`../`）や
 * エンコードが必要な文字で意図しない URL が生成されないよう、英数字・`-`・`_` に限定する。
 */
const SLUG_PATTERN = /^[A-Za-z0-9_-]+$/

/**
 * @function toProjectSlug
 * @description CMS の url フィールドを検証し、URL スラッグとして返す
 * @param {string} url - CMS の url フィールドの値
 * @param {string} title - エラーメッセージ用のプロジェクト名
 * @returns {string} 前後の空白を除いたスラッグ
 * @throws {Error} 使えない文字を含む・空の場合（不正な URL のページを公開しないようビルドを止める）
 */
export const toProjectSlug = (url: string, title: string): string => {
  const slug = url.trim()
  if (!SLUG_PATTERN.test(slug)) {
    throw new Error(
      `projects「${title}」の url に使えない文字が含まれています（英数字・-・_ のみ）: "${url}"`
    )
  }
  return slug
}

/**
 * @function toProject
 * @description CMS の 1 件をページ用のプロジェクトに変換する。
 *              任意フィールドの未入力は空文字・空配列に揃え、テンプレート側の分岐を減らす。
 * @param {ProjectContent} content - microCMS `projects` の 1 件
 * @returns {Project} ページ用のプロジェクト
 */
export const toProject = (content: ProjectContent): Project => {
  const body = content.body ?? ''
  const bodyEn = content.bodyEn ?? ''
  return {
    id: content.id,
    slug: toProjectSlug(content.url, content.title),
    title: content.title,
    year: content.year?.trim() ?? '',
    description: content.description?.trim() ?? '',
    thumbnail: content.thumbnail,
    images: content.images ?? [],
    // 英語の本文が未入力の場合は、ページを空にしないよう日本語の本文で代替する
    body: { ja: body, en: bodyEn.trim().length > 0 ? bodyEn : body },
  }
}

/**
 * @function toProjects
 * @description CMS の一覧をページ用に変換する。並び順は API の指定（公開日の新しい順）を維持する
 * @param {ProjectContent[]} contents - microCMS `projects` の contents
 * @returns {Project[]} ページ用のプロジェクト一覧
 * @throws {Error} url が重複している場合（同じ URL のページが上書きされるのを防ぐ）
 */
export const toProjects = (contents: readonly ProjectContent[]): Project[] => {
  const projects = contents.map(toProject)
  const duplicated = projects
    .map((project) => project.slug)
    .filter((slug, i, slugs) => slugs.indexOf(slug) !== i)
  if (duplicated.length > 0) {
    throw new Error(`projects の url が重複しています: ${[...new Set(duplicated)].join(', ')}`)
  }
  return projects
}

/** 詳細ページ（/projects/[slug]/）の静的パス 1 件 */
export interface ProjectStaticPath {
  params: { slug: string }
  props: { project: Project }
}

/**
 * @function toProjectStaticPaths
 * @description プロジェクト一覧を、詳細ページの getStaticPaths の戻り値に変換する
 * @param {Project[]} projects - ページ用のプロジェクト一覧
 * @returns {ProjectStaticPath[]} slug をパラメータ、プロジェクトを props に持つパス一覧
 */
export const toProjectStaticPaths = (projects: readonly Project[]): ProjectStaticPath[] =>
  projects.map((project) => ({ params: { slug: project.slug }, props: { project } }))

/**
 * @function toProjectPath
 * @description 詳細ページの公開パスを組み立てる
 * @param {string} slug - プロジェクトの URL スラッグ
 * @param {Locale} locale - 対象ロケール
 * @returns {string} 末尾スラッシュ付きの絶対パス（例: '/en/projects/project_1/'）
 */
export const toProjectPath = (slug: string, locale: Locale): string =>
  localizePath(`${ROUTES.projects}/${slug}`, locale)
