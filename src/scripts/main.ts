import { initEmailCopyLinks } from './email-link'
import { initProjectCaption } from './project-caption'
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
