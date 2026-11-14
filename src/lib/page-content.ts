import { ABOUT_PHOTO, PROJECT_IMAGE, TOP_SLIDE } from '@/data/media'
import type { Locale } from '@/i18n/config'
import { useTranslations } from '@/i18n/ui'
import { buildResponsiveImage, type ResponsiveImage } from '@/lib/microcms/image'
import type { AboutContent, TopContent } from '@/lib/microcms/types'
import { toProjectPath, toProjectSlug, type Project } from '@/lib/project'
import { parseRichText, type RichTextParagraph } from '@/lib/rich-text'
import { toDescription, toParagraphs } from '@/lib/text'

/**
 * microCMS のコンテンツを、各ページのビューに渡す形へ変換する関数群。
 * ビルド時の Template（templates/*.astro）と、ブラウザで描画する下書きプレビュー（scripts/preview/）の
 * 両方から使い、公開ページとプレビューで表示内容の解釈がずれないようにする。
 * astro:env と DOM に依存しない純粋関数のみを置く。
 */

/** TOP のスライド 1 枚（参照先プロジェクトの写真と詳細ページへのリンク） */
export interface TopSlide {
  /** プロジェクト名（写真の代替テキスト = リンクの名前に使う） */
  title: string
  /** 詳細ページのパス（例: '/en/projects/project_1/'） */
  href: string
  image: ResponsiveImage
}

/** About ページのビューに渡す値 */
export interface AboutView {
  name: string
  paragraphs: string[][]
  /** meta description（本文の先頭段落） */
  description: string
  photo?: ResponsiveImage | undefined
  photoCaption?: string | undefined
}

/** Project 詳細ページのビューに渡す値 */
export interface ProjectView {
  title: string
  year: string
  description: string
  paragraphs: RichTextParagraph[]
  images: ResponsiveImage[]
}

/** 下書きプレビューの初期表示（ブラウザで下書きを取得するまでの空の状態） */
export const EMPTY_ABOUT_VIEW: AboutView = { name: '', paragraphs: [], description: '' }
export const EMPTY_PROJECT_VIEW: ProjectView = {
  title: '',
  year: '',
  description: '',
  paragraphs: [],
  images: [],
}

/**
 * @function toTopSlides
 * @description TOP のスライド（`top.slider`）を、写真と参照先プロジェクトの詳細ページへのリンクに変換する。
 *              写真はスライド専用の image を優先し、未入力なら参照先の一覧サムネイル → 詳細ページの 1 枚目で代替する。
 *              参照先が未選択（リンク先・代替テキストが決まらない）、または写真が 1 枚も無いスライドは除外する。
 * @param {Pick<TopContent, 'slider'>} top - microCMS `top`
 * @param {Locale} locale - リンク先のロケール
 * @returns {TopSlide[]} スライド
 * @throws {Error} 参照先の url が不正な場合（lib/project.ts の toProjectSlug）
 */
export const toTopSlides = (top: Pick<TopContent, 'slider'>, locale: Locale): TopSlide[] =>
  top.slider.flatMap(({ image: slideImage, content: project }) => {
    if (project === undefined) {
      return []
    }
    const [firstImage] = project.images ?? []
    const image = slideImage ?? project.thumbnail ?? firstImage
    if (image === undefined) {
      return []
    }
    return [
      {
        title: project.title,
        href: toProjectPath(toProjectSlug(project.url, project.title), locale),
        image: buildResponsiveImage(image, TOP_SLIDE.displayWidth, TOP_SLIDE.sizes),
      },
    ]
  })

/**
 * @function toAboutView
 * @description microCMS `about` を、ロケールに応じた About ページの表示内容に変換する
 * @param {AboutContent} about - microCMS `about`
 * @param {Locale} locale - 表示ロケール
 * @returns {AboutView} About ページのビューに渡す値
 */
export const toAboutView = (about: AboutContent, locale: Locale): AboutView => {
  const isJa = locale === 'ja'
  const text = isJa ? about.text : about.textEn
  return {
    name: isJa ? about.name : about.nameEn,
    paragraphs: toParagraphs(text),
    // 和文は行をそのまま連結し、欧文は単語が繋がらないよう空白で連結する
    description: toDescription(text, isJa ? '' : ' '),
    photo:
      about.image && buildResponsiveImage(about.image, ABOUT_PHOTO.displayWidth, ABOUT_PHOTO.sizes),
    photoCaption: about.imageCaption,
  }
}

/**
 * @function toProjectView
 * @description ページ用のプロジェクトを、ロケールに応じた詳細ページの表示内容に変換する
 * @param {Project} project - ページ用のプロジェクト（lib/project.ts の toProject で変換済み）
 * @param {Locale} locale - 表示ロケール
 * @returns {ProjectView} 詳細ページのビューに渡す値
 */
export const toProjectView = (project: Project, locale: Locale): ProjectView => ({
  title: project.title,
  year: project.year,
  description: project.description,
  paragraphs: parseRichText(project.body[locale]),
  images: project.images.map((image) =>
    buildResponsiveImage(image, PROJECT_IMAGE.displayWidth, PROJECT_IMAGE.sizes)
  ),
})

/**
 * @function toProjectPageTitle
 * @description Project 詳細ページの <title> を組み立てる
 * @param {string} title - プロジェクト名
 * @param {Locale} locale - 表示ロケール
 * @returns {string} 例: 'Project 1 | Projects | Katsuaki Kobayashi'
 */
export const toProjectPageTitle = (title: string, locale: Locale): string => {
  const t = useTranslations(locale)
  return `${title} | ${t('nav.projects')} | ${t('meta.title')}`
}

/** Project 詳細で写真の縦横比を渡す CSS カスタムプロパティ（project-detail.css で参照） */
export const PROJECT_RATIO_PROPERTY = {
  lead: '--project-lead-ratio',
  last: '--project-last-ratio',
} as const

/**
 * @function toMediaRatio
 * @description 写真の縦横比（高さ / 幅）を返す。
 *              Project 詳細で、1 枚目・最後の写真を画面の縦中央に揃える CSS に渡す
 *              （写真の比率は CMS の画像ごとに異なり CSS だけでは知り得ないため）。
 * @param {ResponsiveImage | undefined} image - 対象の写真
 * @returns {number} 高さ / 幅。写真が無い場合は 1
 */
export const toMediaRatio = (image: ResponsiveImage | undefined): number =>
  image ? image.height / image.width : 1
