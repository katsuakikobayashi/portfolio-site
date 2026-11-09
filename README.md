# Katsuaki Kobayashi Portfolio

> プロダクト・グラフィック・フォトグラフィを手がけるデザイナーKatsuaki Kobayashi氏のポートフォリオサイトです。日本語と英語の2言語で構成しています。

![Astro](https://img.shields.io/badge/-Astro-000000.svg?logo=astro&style=for-the-badge)
![TypeScript](https://img.shields.io/badge/-TypeScript-000000.svg?logo=typescript&style=for-the-badge)
![Node.js](https://img.shields.io/badge/-Node.js-000000.svg?logo=node.js&style=for-the-badge)
![Netlify](https://img.shields.io/badge/-Netlify-000000.svg?logo=netlify&style=for-the-badge)

## ドキュメント

- [CONTRIBUTING.md](./CONTRIBUTING.md)：コーディングルールと開発プロセス
- [docs/design/](./docs/design/)：デザインカンプと原稿テキスト

## デザイン

| 素材                                   | 内容                                        |
| -------------------------------------- | ------------------------------------------- |
| `docs/design/pc top.png`               | TOPページ デスクトップ（1400×980）          |
| `docs/design/mobile top.png`           | TOPページ モバイル（393×670）               |
| `docs/design/mobile top (menu).png`    | モバイルのフッターメニュー展開時（393×670） |
| `docs/design/pc About (jp/en).png`     | Aboutページ デスクトップ（1400×980）        |
| `docs/design/mobile About (jp/en).png` | Aboutページ モバイル（393×670）             |

TOPのスライド写真、Aboutの氏名・本文・写真・写真クレジット、Projectsの内容はmicroCMSで管理しています（下記「コンテンツ管理」参照）。

Figmaへのアクセスが必要な場合はプロジェクトリーダーへ依頼してください。

---

## Getting Started

### 環境

| 言語・フレームワーク | バージョン |
| -------------------- | ---------- |
| Node.js              | 24.21.0    |
| npm                  | 11.3.x     |
| Astro                | 7.x        |
| TypeScript           | 5.9.x      |

Node.jsのバージョンは`.node-version`と`package.json`の`engines`および`volta`で固定しています。

### インストール

```sh
npm install
```

### 環境変数の設定

`.env.example`をコピーして`.env`を作成し、値を設定してください。`.env`はGit管理対象外です。

```
cp .env.example .env
```

| 変数名                            | 必須 | 内容                                                                               |
| --------------------------------- | ---- | ---------------------------------------------------------------------------------- |
| `MICROCMS_DOMAIN`                 | ○    | microCMSのサービスドメイン（`xxx`）またはサービスURL（`https://xxx.microcms.io/`） |
| `MICROCMS_API_KEY`                | ○    | microCMSのAPIキー。GET権限のみのキーを使用すること                                 |
| `PUBLIC_MICROCMS_PREVIEW_API_KEY` |      | 下書きプレビュー用のAPIキー。未設定時は`MICROCMS_API_KEY`と同じ値を使う            |
| `PUBLIC_GTM_ID`                   |      | Google Tag ManagerのコンテナID                                                     |

`MICROCMS_DOMAIN`と`MICROCMS_API_KEY`はビルド時に参照します。未設定のままビルドするとエラーで停止します。

下書きプレビュー（後述）はブラウザからmicroCMSを呼び出すため、`PUBLIC_MICROCMS_PREVIEW_API_KEY`の値（未設定時は`MICROCMS_API_KEY`の値）がプレビューページ専用のJavaScriptに含まれ、公開されます。公開ページのJavaScriptには含まれません。

`PUBLIC_GTM_ID`が未設定のときは計測スクリプトを一切出力しません。設定した場合は`netlify.toml`のContent-Security-Policyの`script-src`に`https://www.googletagmanager.com`を追加する必要があります。

本番ドメインを変更する場合は環境変数`SITE_URL`で上書きできます。canonical、hreflang、sitemapの生成に反映されます。

---

## コマンド一覧

| コマンド                     | 処理内容                                              |
| ---------------------------- | ----------------------------------------------------- |
| `npm run dev`                | ローカル開発サーバーの起動（`http://localhost:4321`） |
| `npm run build`              | 本番ビルド（`dist/`へ出力）                           |
| `npm run preview`            | ビルド結果のプレビュー                                |
| `npm run type-check`         | 型チェック（`astro check`）                           |
| `npm run lint`               | ESLintによる静的解析                                  |
| `npm run lint:fix`           | ESLintの自動修正                                      |
| `npm run format`             | Prettierによる整形                                    |
| `npm run test`               | ユニットテストとE2Eテストの実行                       |
| `npm run test:unit`          | ユニットテスト（Vitest）                              |
| `npm run test:unit:coverage` | カバレッジ計測                                        |
| `npm run test:e2e`           | E2Eテスト（Playwright、ChromiumとWebKit）             |
| `npm run test:report`        | E2EテストのHTMLレポート表示                           |

---

## サイト構成

| パス                        | 言語            | 内容                                                |
| --------------------------- | --------------- | --------------------------------------------------- |
| `/`                         | 日本語          | TOP                                                 |
| `/en/`                      | English         | TOP                                                 |
| `/about/`                   | 日本語          | About                                               |
| `/en/about/`                | English         | About                                               |
| `/projects/`                | 日本語          | Projects一覧（公開日の新しい順）                    |
| `/en/projects/`             | English         | Projects一覧（公開日の新しい順）                    |
| `/projects/{url}/`          | 日本語          | Project詳細（`{url}`はCMSの`url`の値）              |
| `/en/projects/{url}/`       | English         | Project詳細（`{url}`はCMSの`url`の値）              |
| `/preview/`・`/en/preview/` | 日本語・English | 下書きプレビュー（TOP / About / Project詳細。後述） |

言語切り替えは静的リンクのみで実装しています。JavaScriptはメールアドレスのコピー、SPメニューの開閉、TOPのスライドショー、Project詳細の概要エリアの高さ計測、下書きプレビューにのみ使用しています。

---

## コンテンツ管理（microCMS）

| エンドポイント | 形式         | フィールド                                                                     | 使用箇所                      |
| -------------- | ------------ | ------------------------------------------------------------------------------ | ----------------------------- |
| `top`          | オブジェクト | `slideImages`（画像・複数）                                                    | TOPのスライドショー（PCのみ） |
| `about`        | オブジェクト | `image`、`imageCaption`、`name`、`nameEn`、`text`、`textEn`                    | About                         |
| `projects`     | リスト       | `title`、`url`、`year`、`description`、`thumbnail`、`images`、`body`、`bodyEn` | Projects一覧・詳細            |

- 型定義は[src/lib/microcms/types.ts](./src/lib/microcms/types.ts)です。管理画面でフィールドを変更した場合はここも更新してください。
- 本文（`text` / `textEn`）は空行で段落、改行で行を分けます。HTMLとしては解釈しません。
- Projectsの`url`は詳細ページのURLになります。使える文字は英数字・`-`・`_`のみです。不正な文字や重複があるとビルドを止めます。
- Projectsの本文（`body` / `bodyEn`）はリッチテキストです。段落・改行と、カスタムクラス付きの範囲（黒100%で表示）だけを解釈し、それ以外の装飾（リンク・太字など）は文字だけを表示します（[src/lib/rich-text.ts](./src/lib/rich-text.ts)）。HTMLをそのまま埋め込まないため、サニタイズライブラリは使っていません。`bodyEn`が空の場合は`body`を表示します。
- 取得タイミング: `npm run build`（本番）はビルド時に1回だけ取得します。`npm run dev`（ローカル）はページを開くたびに取得するため、CMSの変更がリロードで反映されます。
- 画像はmicroCMSの画像APIで配信します（[src/lib/microcms/image.ts](./src/lib/microcms/image.ts)）。形式はWebP（`fm=webp`）に統一し、DPR 1x・2x・3xの候補を`srcset`に並べます。画質（`q`）はDPR 1xで80、2xで60、3xで45です。高DPR端末では画素が細かく圧縮ノイズが目立たないため、解像度を上げる分だけ画質を下げて転送量を抑えています。

---

## 下書きプレビュー（microCMS）

microCMSの下書きを、本番ドメインで公開前に確認できます。対象はTOP / About / Project詳細の3画面（日本語・英語）です。

ページ自体は静的に出力し、ブラウザのJavaScriptがURLの`draftKey`（Projectは`contentId`も）を使ってmicroCMSから下書きを取得して描画します（[src/scripts/preview/](./src/scripts/preview/)）。描画の構造と文字・画像の変換は公開ページと共通です（[src/lib/page-content.ts](./src/lib/page-content.ts)）。

### 設定（初回のみ）

microCMSの各API設定 > 画面プレビューに、次のURLを登録します（英語版で確認したい場合は`/preview/`を`/en/preview/`にします）。

| API        | 画面プレビューのURL                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `top`      | `https://www.katsuakikobayashi.com/preview/?draftKey={DRAFT_KEY}`                                 |
| `about`    | `https://www.katsuakikobayashi.com/preview/about/?draftKey={DRAFT_KEY}`                           |
| `projects` | `https://www.katsuakikobayashi.com/preview/projects/?contentId={CONTENT_ID}&draftKey={DRAFT_KEY}` |

### 動作

- 画面右上に状態（読み込み中・下書きプレビュー・エラー）を表示します。
- クエリなしで直接アクセスした場合や、値の形式が不正な場合は、公開中のページへ移動します（TOP→`/`、About→`/about/`、Project→`/projects/`。英語版は`/en/`付き）。JavaScriptが無効な場合も同じページへ移動します。
- 言語切り替え（JP / EN）のリンクには`draftKey`などを引き継ぐため、同じ下書きを日英で確認できます。
- `noindex`（meta・`X-Robots-Tag`）、robots.txtの`Disallow`、sitemapからの除外により、検索エンジンには載せません。

### 注意点

- **APIキーの公開**: プレビュー用のJavaScriptにAPIキーが含まれ、誰でも取得できる状態になります。キーの権限は必ず`top`・`about`・`projects`のGETのみにし、「全下書きの取得」やPOST・PUT・PATCH・DELETEを付けないでください。第三者がこのキーでAPIを呼び出し、microCMSのAPIリクエスト数・転送量の枠を消費するおそれがあります。キーを分けたくなった場合は、GET権限のみの専用キーを発行して`PUBLIC_MICROCMS_PREVIEW_API_KEY`に設定し、再ビルドしてください（コードの変更は不要です）。
- **draftKeyが誤っている・期限切れの場合**: microCMSはエラーを返さず、公開中の内容を返します。そのため、プレビューに公開中の内容が表示されたときは、管理画面のプレビューボタンからURLを開き直してください。Projectで`contentId`が存在しない場合は「下書きが見つかりません」と表示します。
- **和文フォント**: 和文フォント（Noto Sans JP）は、ビルド時点のCMSの文字だけを含むよう生成しています（[src/lib/font-glyphs.ts](./src/lib/font-glyphs.ts)）。下書きで新しく追加した漢字などは、プレビューでのみ代替フォントで表示されます。公開後の再ビルドで解消します。
- **meta情報**: プレビューのmeta description・OGPは公開用の内容を反映しません（`noindex`のページのため）。Project詳細の`<title>`のみ下書きのタイトルに更新します。
- **CSP**: ブラウザからAPIを呼ぶため、[netlify.toml](./netlify.toml)のContent-Security-Policyに`connect-src 'self' https://*.microcms.io`を追加しています。

---

## デプロイ

NetlifyとGitHubリポジトリが連携済みで、`main`ブランチへのpushで自動デプロイされます。

| 項目              | 設定値          |
| ----------------- | --------------- |
| ビルドコマンド    | `npm run build` |
| 公開ディレクトリ  | `dist`          |
| Node.jsバージョン | `24.22.2`       |

ビルド設定、セキュリティヘッダー、キャッシュ設定は[netlify.toml](./netlify.toml)で管理しています。Deploy PreviewでNetlify Drawer（レビュー用ツールバー）を表示するため、Content-Security-Policyに`frame-src 'self' https://app.netlify.com`を追加しています。ビルド成果物の`dist/`はNetlify側で生成するためGit管理対象外です。

### microCMSとの連携設定（初回のみ）

1. NetlifyのSite configuration > Environment variablesに、`MICROCMS_DOMAIN`と`MICROCMS_API_KEY`を登録します。
2. NetlifyのBuild hooksでフックURLを発行します。
3. microCMSの各API設定 > Webhookで「Netlify」を選び、2で発行したURLを登録します（`top`、`about`、`projects`のすべて）。

これで、CMSでコンテンツを公開すると自動で再ビルド・デプロイされます。

---

## ブランチルール

| ブランチ名                               | 概要                                        |
| ---------------------------------------- | ------------------------------------------- |
| `main`                                   | 本番環境。pushでNetlifyへ自動デプロイされる |
| `develop`                                | 開発進行中かつ本番化前の最新ファイルを管理  |
| `mマイルストーン番号/feature/#Issue番号` | issueベースで作業する際に`develop`から作成  |

1. `develop`から`m〇〇/feature/#〇〇`ブランチを作成して実装する
1. `npm run lint:fix`、`npm run type-check`、`npm run test`をローカルで通す
1. `develop`へPull Requestを作成してレビューを受ける
1. 検収後に`develop`を`main`へマージし、本番へ反映する

---

## 開発関連ルール

### 対応ブラウザ

Chrome、Safari、Firefox、Edgeの各最新版。

### HTML

- セマンティックなHTML5を使用し、`<div>`の多用を避ける
- 各`<section>`に対応する見出しを必ず持たせる
- WCAG 2.1 Level AAを目標とし、`lang`、`aria-label`、`aria-current`を適切に付与する

### CSS

- 設計手法はmFLOCSS（`@layer`による8層構成）
- 命名規則はBEM（Block\_\_Element--Modifier）
- 色、サイズ、余白はすべて`:root`のカスタムプロパティ経由で指定し、生値のハードコードを禁止する
- レスポンシブはメディアクエリを使わず、`clamp()`と独自のフルード計算ヘルパー`--fluid`で全幅可変にする

```
src/styles/
├── index.css            # @layer 宣言と各層の読み込み
├── tokens.css           # Tokens 層: プリミティブな設計値
├── theme.css            # Theme 層: セマンティックな変数
├── foundation.css       # Foundation 層: ベーススタイル
├── layout.css           # Layout 層: 位置と空間
├── component/           # Component 層: 再利用可能な部品
├── project/             # Project 層: ページ固有のスタイル
├── animation.css        # Animation 層: モーションと prefers-reduced-motion
└── utility.css          # Utility 層: 最終上書き
```

### JavaScript・TypeScript

- TypeScript Strict Mode（`astro/tsconfigs/strictest`）を使用し、`any`型は使用禁止
- 共通関数にはJSDocを必須とする
- 配信するJavaScriptは、メールアドレスをクリップボードにコピーする機能（`src/components/EmailLink.astro`）用の1ファイル（約400バイト）のみ。全ページで共有・キャッシュされる。CSPは`script-src 'self'`のみを許可しているため、Astroの既定動作（4KB未満のscriptをHTMLへインライン展開する）を`astro.config.mjs`の`vite.build.assetsInlineLimit: 0`で無効化し、常に外部ファイルとして出力させている
- スクリプトの本数・配信元はE2Eテストで担保している

### デザイントークン

| 項目                     | 値                                                           |
| ------------------------ | ------------------------------------------------------------ |
| 背景色                   | `#ededeb` / `oklch(94.55% 0.0027 106.5)`                     |
| 文字色                   | `#000000`                                                    |
| 淡色（写真クレジット）   | 背景色の30%暗転にあたる`#a6a6a5`                             |
| 欧文フォント             | Roboto 400                                                   |
| 和文フォント             | Noto Sans JP 400                                             |
| 基準ビューポート         | 393px（iPhone 16）から1400px（Desktop）                      |
| PCレイアウトへの切り替え | 64rem（1024px）以上                                          |
| グリッド                 | PC 4カラム（236 : 218 : 375 : 451）、SP 2カラム（113 : 216） |

フォントはAstroのFonts APIでセルフホストしており、外部CDNへのリクエストは発生しません。

### 画像の書き出し形式

- 写真および図版はWebPまたはAVIF。`srcset`によるマルチレゾリューション対応を必須とする
- アイコンおよびロゴはSVG
- OGP画像のみ互換性のためPNG（`public/ogp.png`、1200×630）

---

## 納品チェックリスト

### コード品質

- [ ] `npm run lint`がエラーなしで完了する
- [ ] `npm run type-check`がエラーなしで完了する
- [ ] `npm run test`が全件パスする
- [ ] `console.log`、未使用import、未使用変数が残っていない

### パフォーマンスとSEO

- [ ] Lighthouseスコアが90以上（デスクトップとモバイル）
- [ ] Core Web VitalsがGreen
- [ ] `sitemap-index.xml`と`robots.txt`が生成されている
- [ ] ErrorとWarningがブラウザコンソールに1件も出ない

### アクセシビリティ

- [ ] WCAG 2.1 Level AAに準拠している（axe DevToolsで検証）
- [ ] Tabキー操作でフォーカスリングが視認できる

### ドキュメント

- [ ] README.mdが最新の内容で更新されている
- [ ] Conventional Commits形式でコミットメッセージを記述している

---

## 解析タグ

Google Tag Managerの注入は[src/components/Analytics.astro](./src/components/Analytics.astro)に集約しています。`PUBLIC_GTM_ID`を設定すると`async`属性付きで読み込まれ、DOM構築をブロックしません。

---

## 構造化データ・LLM向け情報

- 構造化データ: 全ページの`<head>`にPerson（schema.org）のJSON-LDを出力しています（[src/layouts/BaseLayout.astro](./src/layouts/BaseLayout.astro)）。氏名・肩書き・SNS・メールなどサイト内の既存データから生成しており、二重管理はありません。
- `/llms.txt`: [llmstxt.org](https://llmstxt.org/)準拠のMarkdownをエンドポイント（[src/pages/llms.txt.ts](./src/pages/llms.txt.ts)）で生成しています。LLM/AIエージェント向けにページ一覧と連絡先を要約しています。

---

## 申し送り事項

- InstagramのURLが未確定です。`src/data/site.ts`の`instagramUrl`が仮値のため、実アカウントURLへの差し替えが必要です。
- 文字サイズ・字間・余白はデザインPNGの実測から逆算した値です。Figmaの詳細指定を受領後、`src/styles/tokens.css`と`src/styles/theme.css`を差し替えてください。
- PC/SPの切り替え幅（64rem）は、CSSの各メディアクエリ、`src/data/media.ts`の`PC_MEDIA_QUERY`、`src/scripts/slideshow.ts`の3箇所で一致させています。変更時はすべて更新してください。
- Aboutの写真はPCで本文にホバー（キーボード操作時はフォーカス）したときだけ表示します。ホバーできない端末でPCレイアウトになった場合（大型タブレットなど）は常時表示します。SPでは表示しません。
- Project詳細（PC）は、プロフィールを`position: sticky`でファーストビューの位置に固定し、写真だけをスクロールさせています。概要（キャプション）は左カラムの氏名と揃えた位置から始まり、エリア全体が画面の縦中央に来たところで固定されます。概要の高さは本文量で変わるため、[src/scripts/project-caption.ts](./src/scripts/project-caption.ts)がResizeObserverで計測してCSSへ渡しています（スクロールイベントは使っていません）。1枚目の写真は縦中央から`--project-lead-shift`だけ下げた位置から始まります。
- Projects一覧（PC）は、一覧の上端を画面の高さの32.4%（`--projects-list-start`。カンプの980px高で約318px）の位置に置いています。画面が低く一覧がフッターに重なる場合は、自動で上に詰めます。
- Projects一覧のサムネイルはPCで項目にホバー（キーボード操作時はフォーカス）したときだけ表示します。SPとホバーできない端末では表示しません。サムネイルの上端は一覧の上端（1件目）に揃えています。一覧が画面より長くなっても、サムネイルは画面に固定せず一覧と一緒にスクロールします。
- 写真クレジットの配色（`#a6a6a5`と`#ededeb`の組み合わせ）はコントラスト比が約2.1対1で、WCAG 2.1 AAの4.5対1を満たしません。デザイン意図を優先して実装しています。準拠が必要な場合は`--color-text-muted`を調整してください。
- Noto Sans JPは`@font-face`定義が125件あり、日本語ページのHTMLをgzip後で約32KB増やします。Aboutのデザイン確定時に、使用文字だけをサブセット化したwoff2のセルフホストへ切り替えることを推奨します。
