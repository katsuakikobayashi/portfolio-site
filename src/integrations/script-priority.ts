import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'

/**
 * Astro が出力する module script（/_astro/*.js）の取得優先度を下げる。
 *
 * Chrome は <script type="module"> を優先度 High で取得するため、Lighthouse の
 * 「重要なリクエストのチェーン（Network dependency tree）」に HTML → JS の連鎖として計上される。
 * このサイトの JS はメニュー開閉などの操作系のみで、初期描画にも LCP にも関わらないため、
 * fetchpriority="low" を付けて LCP 画像などの帯域を優先させ、チェーンからも外す。
 * module script はもともと HTML の解析後に実行されるため、実行タイミングは変わらない。
 *
 * Astro が処理する <script> には属性を書けない（書くと is:inline 扱いになりバンドルされない）。
 * そのため、ビルド完了後に出力 HTML へ属性を付与する。
 * インライン化しない理由は astro.config.mjs（assetsInlineLimit）を参照。
 */

/** fetchpriority 未指定の、/_astro/ 配下を読み込む module script の開始タグ */
const BUNDLED_MODULE_SCRIPT =
  /<script type="module"(?![^>]*\bfetchpriority=)([^>]*\bsrc="\/_astro\/[^"]+\.js"[^>]*)>/g

/** 対象とする出力ファイルの拡張子 */
const HTML_EXTENSION = '.html'

/**
 * @function addLowFetchPriority
 * @description HTML 内のバンドル済み module script に fetchpriority="low" を付与する。
 *              外部オリジンのスクリプトや、すでに fetchpriority を持つタグは変更しない。
 * @param {string} html - 出力 HTML
 * @returns {string} 属性を付与した HTML
 */
export const addLowFetchPriority = (html: string): string =>
  html.replace(BUNDLED_MODULE_SCRIPT, '<script type="module" fetchpriority="low"$1>')

/**
 * @function scriptPriority
 * @description ビルド完了後、出力された全 HTML の module script に fetchpriority="low" を付与する Astro integration
 * @returns {AstroIntegration} astro.config の integrations に渡す設定
 */
export const scriptPriority = (): AstroIntegration => ({
  name: 'script-priority',
  hooks: {
    'astro:build:done': async ({ dir, logger }) => {
      const outDir = fileURLToPath(dir)
      const htmlFiles = (await readdir(outDir, { recursive: true })).filter((file) =>
        file.endsWith(HTML_EXTENSION)
      )
      const results = await Promise.all(
        htmlFiles.map(async (file) => {
          const path = join(outDir, file)
          const html = await readFile(path, 'utf8')
          const updated = addLowFetchPriority(html)
          if (updated === html) {
            return false
          }
          await writeFile(path, updated)
          return true
        })
      )
      logger.info(`fetchpriority="low" を ${results.filter(Boolean).length} ページに付与しました`)
    },
  },
})
