import { initEmailCopyLinks } from './email-link'
import { initProjectCaption } from './project-caption'
import { PREVIEW_STATUS_SELECTOR } from './preview/selector'
import { initSiteMenu } from './site-menu'
import { initSlideshows } from './slideshow'

/**
 * 全ページ共通の JS エントリポイント。
 *
 * コンポーネントごとに <script> を置くと、Astro はそれぞれを別ファイルとして出力し、
 * 1 ページで複数のリクエスト（クリティカルリクエストチェーン）が発生する。
 * 合計でも数 KB と小さいため、1 ファイルにまとめてリクエストを 1 本にする。
 * インライン化しないのは、netlify.toml の CSP が script-src 'self' のみを許可しているため。
 *
 * 各 init 関数は対象要素が無いページでは何もしないため、全ページで呼び出してよい。
 */
initSiteMenu()
initEmailCopyLinks()
initSlideshows()
initProjectCaption()

// 下書きプレビュー（/preview/）のページでのみ、プレビューのスクリプトを別ファイルとして読み込む。
// API キーを含むため公開ページの JS には入れない。静的 import にすると、プレビューと共通の
// モジュール（slideshow 等）が別チャンクに切り出され、公開ページのリクエストが増えるため動的 import にする。
if (document.querySelector(PREVIEW_STATUS_SELECTOR) !== null) {
  void import('./preview')
}
