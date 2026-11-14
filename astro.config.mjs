// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config'
import { existsSync } from 'node:fs'
import sitemap from '@astrojs/sitemap'
import { PREVIEW_ROUTE } from './src/data/site.ts'
import { fetchSiteGlyphs } from './src/lib/font-glyphs.ts'
import { scriptPriority } from './src/integrations/script-priority.ts'

/**
 * 本番ドメイン。Netlify 側の環境変数 `SITE_URL` で上書き可能。
 * canonical / hreflang / sitemap.xml の生成に使用する。
 */
const SITE_URL = process.env.SITE_URL ?? 'https://www.katsuakikobayashi.com'

// 設定ファイルの評価時点では .env が process.env に読み込まれていないため、ローカルでは明示的に読む。
// Netlify では管理画面の環境変数が process.env に入っているため .env は無い（既存の値は上書きされない）。
if (existsSync('.env')) {
  process.loadEnvFile('.env')
}

/**
 * Noto Sans JP に含める文字（UI 文言 + microCMS の全テキスト）。
 * 未指定だと日本語の全 unicode-range（約 120 個の @font-face）が各ページにインライン展開されるため、
 * 使う文字だけのフォントを生成する。詳細は src/lib/font-glyphs.ts を参照。
 * CMS の文章を更新した場合はビルドし直すこと（ローカル dev はサーバーの再起動で反映）。
 */
const japaneseGlyphs = await fetchSiteGlyphs({
  serviceDomain: process.env.MICROCMS_DOMAIN ?? '',
  apiKey: process.env.MICROCMS_API_KEY ?? '',
})

export default defineConfig({
  site: SITE_URL,
  i18n: {
    locales: ['ja', 'en'],
    defaultLocale: 'ja',
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    // ページ数・CSS量ともに小さいため、全 CSS をインライン展開して
    // レンダリングブロックとなるリクエストを 0 にする（LCP / Ecograder 対策）。
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      // Astro は 4KB 未満の script を既定で HTML にインライン展開するが、
      // netlify.toml の CSP は script-src 'self' のみで 'unsafe-inline' を
      // 許可していない。インラインだと本番でブラウザにブロックされるため、
      // 常に外部ファイル（/_astro/*.js）として出力させる。
      assetsInlineLimit: 0,
    },
  },
  env: {
    schema: {
      // 計測タグの拡張ポイント。未設定時は計測スクリプトを一切出力しない。
      PUBLIC_GTM_ID: envField.string({ context: 'client', access: 'public', optional: true }),
      // microCMS。ビルド時（本番）/ リクエスト時（ローカル dev）にサーバー側でのみ参照する。
      // API キーはクライアントバンドルに含めないよう secret として宣言する。
      MICROCMS_API_KEY: envField.string({ context: 'server', access: 'secret' }),
      // サービスドメイン（`xxx`）またはサービス URL（`https://xxx.microcms.io/`）のどちらでも可
      MICROCMS_DOMAIN: envField.string({ context: 'server', access: 'secret' }),
      // 下書きプレビュー（/preview/）でブラウザから microCMS を呼ぶための API キー。
      // ブラウザ向けの JS に埋め込まれ公開されるため public として宣言する（プレビューのページでのみ読み込む）。
      // 運用判断により、既定では MICROCMS_API_KEY と同じキーを使う。GET 権限のみに絞った専用キーへ
      // 切り替える場合は、この環境変数を設定するだけでよい（コードの変更は不要）。
      PUBLIC_MICROCMS_PREVIEW_API_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
        default: process.env.MICROCMS_API_KEY ?? '',
      }),
    },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Roboto',
      cssVariable: '--font-roboto',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['Noto Sans JP', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Noto Sans JP',
      cssVariable: '--font-noto-sans-jp',
      weights: [400],
      styles: ['normal'],
      subsets: ['japanese', 'latin'],
      display: 'swap',
      fallbacks: ['sans-serif'],
      options: { experimental: { glyphs: japaneseGlyphs } },
    },
  ],
  integrations: [
    // module script の取得優先度を下げ、クリティカルリクエストチェーンから外す（理由は同ファイル参照）
    scriptPriority(),
    sitemap({
      // 下書きプレビュー（/preview/・/en/preview/）は公開ページではないため載せない
      filter: (page) => !new URL(page).pathname.split('/').includes(PREVIEW_ROUTE),
      i18n: {
        defaultLocale: 'ja',
        locales: {
          ja: 'ja-JP',
          en: 'en-US',
        },
      },
    }),
  ],
})
