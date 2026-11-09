import { PUBLIC_MICROCMS_PREVIEW_API_KEY } from 'astro:env/client'
import type { Locale } from '@/i18n/config'
import { useTranslations, type UiKey } from '@/i18n/ui'
import { getLocaleFromPath } from '@/i18n/utils'
import { createMicrocmsClient, type MicrocmsClient } from '@/lib/microcms/client'
import { toAboutView, toProjectView, toTopSlides } from '@/lib/page-content'
import {
  isPreviewPage,
  parseDraftParams,
  parseDraftProjectParams,
  resolveDraft,
  toPreviewFallbackPath,
  toPreviewQuery,
  type DraftParams,
  type PreviewPage,
} from '@/lib/preview'
import { toProject } from '@/lib/project'
import { renderAboutPreview } from './about'
import { renderProjectPreview } from './project'
import { PREVIEW_STATUS_SELECTOR } from './selector'
import { renderTopPreview } from './top'

/**
 * 下書きプレビューのエントリポイント（状態表示の要素があるページで main.ts から動的に読み込む）。
 *
 * 1. URL の draftKey / contentId を検証する。無い・不正なら公開中のページへリダイレクトする
 * 2. ブラウザから microCMS の下書きを取得する（API キーは PUBLIC_MICROCMS_PREVIEW_API_KEY）
 * 3. ビルド時と同じ変換（lib/page-content.ts）を通して、ビューと同じ構造の DOM を描画する
 * 4. 言語切り替えのリンクにクエリを引き継ぎ、状態表示を更新する
 */

/**
 * 下書きを取得・描画する処理。
 * 戻り値は言語切り替えに引き継ぐクエリ。下書きが見つからない場合は null。
 */
type PreviewTask = (client: MicrocmsClient) => Promise<string | null>

/**
 * @function preparePreview
 * @description 検証済みの値から、下書きを取得・描画する処理を組み立てる
 * @param {P | null} params - URL から取り出した値（不正なら null）
 * @param {(client: MicrocmsClient, params: P) => Promise<T>} load - 下書きの取得処理
 * @param {(content: T) => void} render - 下書きの描画処理
 * @returns {PreviewTask | null} 下書きを取得・描画する処理。値が不正なら null
 */
const preparePreview = <P extends DraftParams, T>(
  params: P | null,
  load: (client: MicrocmsClient, params: P) => Promise<T>,
  render: (content: T) => void
): PreviewTask | null =>
  params === null
    ? null
    : async (client) => {
        const draft = await resolveDraft(params, (validParams) => load(client, validParams))
        if (draft === null) {
          return null
        }
        render(draft.content)
        return toPreviewQuery(draft.params)
      }

/** ページの種類ごとの、URL の検証・下書きの取得・描画 */
const PREVIEW_TASKS: Readonly<
  Record<PreviewPage, (searchParams: URLSearchParams, locale: Locale) => PreviewTask | null>
> = {
  top: (searchParams, locale) =>
    preparePreview(
      parseDraftParams(searchParams),
      (client, { draftKey }) => client.get('top', { draftKey }),
      (top) => renderTopPreview(toTopSlides(top, locale))
    ),
  about: (searchParams, locale) =>
    preparePreview(
      parseDraftParams(searchParams),
      (client, { draftKey }) => client.get('about', { draftKey }),
      (about) => renderAboutPreview(toAboutView(about, locale), locale)
    ),
  project: (searchParams, locale) =>
    preparePreview(
      parseDraftProjectParams(searchParams),
      (client, { contentId, draftKey }) => client.getListItem('projects', contentId, { draftKey }),
      (content) => renderProjectPreview(toProjectView(toProject(content), locale), locale)
    ),
}

/**
 * @function updateLangSwitchLinks
 * @description 言語切り替えのリンクにプレビューのクエリを付け、切り替え先でも同じ下書きを表示させる
 * @param {string} query - 先頭の `?` を含むクエリ文字列（toPreviewQuery で組み立て済み）
 * @returns {void}
 */
const updateLangSwitchLinks = (query: string): void => {
  document.querySelectorAll<HTMLAnchorElement>('.js-lang-switch-link').forEach((link) => {
    const url = new URL(link.href)
    url.search = query
    link.href = url.href
  })
}

/**
 * @function initPreview
 * @description 下書きプレビューを開始する
 * @param {HTMLElement} status - 状態表示の要素（`.js-preview-status`）
 * @returns {Promise<void>}
 */
const initPreview = async (status: HTMLElement): Promise<void> => {
  const { previewPage, microcmsOrigin } = status.dataset
  if (!isPreviewPage(previewPage) || microcmsOrigin === undefined) {
    return
  }

  const locale = getLocaleFromPath(window.location.pathname)
  const t = useTranslations(locale)
  const setStatus = (key: UiKey): void => {
    status.textContent = t(key)
  }

  const task = PREVIEW_TASKS[previewPage](new URLSearchParams(window.location.search), locale)
  if (task === null) {
    // クエリなしの直接アクセス・不正な値は、公開中のページへ移動させる（履歴に残さない）
    window.location.replace(toPreviewFallbackPath(previewPage, locale))
    return
  }

  const apiKey = PUBLIC_MICROCMS_PREVIEW_API_KEY ?? ''
  if (apiKey.trim().length === 0) {
    setStatus('preview.notConfigured')
    return
  }

  try {
    const query = await task(createMicrocmsClient({ serviceDomain: microcmsOrigin, apiKey }))
    if (query === null) {
      setStatus('preview.notFound')
      return
    }
    updateLangSwitchLinks(query)
    setStatus('preview.ready')
  } catch {
    // コンソールを汚さないよう、エラーは状態表示でのみ編集者に伝える
    setStatus('preview.failed')
  }
}

const status = document.querySelector<HTMLElement>(PREVIEW_STATUS_SELECTOR)
if (status !== null) {
  void initPreview(status)
}
