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

| 素材                            | 内容                                  |
| ------------------------------- | ------------------------------------- |
| `docs/design/Desktop - 1.png`   | TOPページ デスクトップ（1440×1024）   |
| `docs/design/iPhone 16 - 1.png` | TOPページ モバイル（393×852）         |
| `docs/design/about-pc.png`      | Aboutページ デスクトップ（1440×1024） |
| `docs/design/about-sp.png`      | Aboutページ モバイル（393×852）       |
| `docs/design/web text.rtf`      | 掲載原稿（日本語・英語）              |

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

必須の環境変数はありません。計測タグを有効化する場合のみ、プロジェクトルートに`.env`を作成してください。

```
PUBLIC_GTM_ID=GTM-XXXXXXX
```

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

| パス         | 言語    | 内容  |
| ------------ | ------- | ----- |
| `/`          | 日本語  | TOP   |
| `/en/`       | English | TOP   |
| `/about/`    | 日本語  | About |
| `/en/about/` | English | About |

言語切り替えは静的リンクのみで実装しており、JavaScriptを一切使用していません。

---

## デプロイ

NetlifyとGitHubリポジトリが連携済みで、`main`ブランチへのpushで自動デプロイされます。

| 項目              | 設定値          |
| ----------------- | --------------- |
| ビルドコマンド    | `npm run build` |
| 公開ディレクトリ  | `dist`          |
| Node.jsバージョン | `24.21.0`       |

ビルド設定、セキュリティヘッダー、キャッシュ設定は[netlify.toml](./netlify.toml)で管理しています。ビルド成果物の`dist/`はNetlify側で生成するためGit管理対象外です。

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

| 項目               | 値                                       |
| ------------------ | ---------------------------------------- |
| 背景色             | `#ccccc5` / `oklch(84.32% 0.0096 106.6)` |
| 文字色             | `#000000`                                |
| 淡色（著作権表記） | 背景色の30%暗転にあたる`#8f8f8a`         |
| 欧文フォント       | Roboto 400                               |
| 和文フォント       | Noto Sans JP 400                         |
| 基準ビューポート   | 393px（iPhone 16）から1440px（Desktop）  |

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
- 字間は暫定値です。Figmaの詳細指定を受領後、`src/styles/theme.css`の`--letter-spacing-*`を差し替えてください。
- AboutページはPC（`docs/design/about-pc.png`）とSP（`docs/design/about-sp.png`）でDOM構造が異なるため、`src/styles/project/about.css`の`min-width: 768px`の1箇所にのみメディアクエリを使用しています（mFLOCSSのPC/SP別DOM分岐ルールに基づく例外）。段落の改行位置はFigmaの実データ幅に対して近似値のため、詳細指定を受領後に`.p-about__content`の`max-inline-size`を調整してください。
- 著作権表記の配色（`#8f8f8a`と`#ccccc5`の組み合わせ）はコントラスト比が約2.0対1で、WCAG 2.1 AAの4.5対1を満たしません。デザイン意図を優先して実装しています。準拠が必要な場合は`--color-text-muted`を調整してください。
- Noto Sans JPは`@font-face`定義が125件あり、日本語ページのHTMLをgzip後で約32KB増やします。Aboutのデザイン確定時に、使用文字だけをサブセット化したwoff2のセルフホストへ切り替えることを推奨します。
