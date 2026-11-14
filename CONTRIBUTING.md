# Contribution Guide

このドキュメントは、本プロジェクトへ参加するエンジニア向けの開発ルールとプロセスをまとめたものです。サイトの概要とコマンド一覧は[README.md](./README.md)を参照してください。

## 前提条件

- Node.js 24.21.0（`.node-version`で固定。voltaまたは同等のバージョン管理ツールを推奨）
- npm 11.3系
- [README.md](./README.md)を読了していること

## セットアップ

```sh
git clone git@github.com:katsuakikobayashi/portfolio-site.git
cd portfolio-site
npm install
npm run dev
```

E2Eテストを実行する場合は、初回のみブラウザの取得が必要です。

```sh
npx playwright install chromium webkit
```

---

## ディレクトリ構成

```
src/
├── components/     # 画面部品（Astro コンポーネント）
├── data/           # サイト共通の定数
├── i18n/           # ロケール定義・文言辞書・パス変換ユーティリティ
├── layouts/        # 全ページ共通の <head> と body 骨格
├── pages/          # ルーティング（ファイル配置がそのまま URL になる）
└── styles/         # mFLOCSS の 8 層
docs/design/        # デザインカンプと原稿
tests/e2e/          # Playwright の E2E テスト
public/             # そのまま配信される静的ファイル
```

---

## コーディングルール

### 共通

- 実装範囲は担当issueのスコープ内に収め、無関係なファイルへ変更を波及させないこと
- 共通ロジックは関数として切り出し、DRY原則を徹底すること
- マジックナンバーと認証情報のハードコードを禁止する。設定値は`src/data/site.ts`または環境変数に置くこと

### HTML

- `<div>`の多用を禁止する。`header`、`nav`、`main`、`section`、`footer`を意味論的に正しく入れ子にすること
- 各`section`には対応する見出しを必ず持たせること
- リンクテキストは単体で目的がわかる文言にすること

### CSS

CSSはmFLOCSSの8層構成で管理します。どの層に書くかは以下の順に判定してください。

| 質問                                       | 該当する層 |
| ------------------------------------------ | ---------- |
| クラスなしで適用されるか                   | Foundation |
| プリミティブな設計値か                     | Tokens     |
| 設計値にセマンティックな名前を付ける作業か | Theme      |
| 位置と空間だけの責務か                     | Layout     |
| 他サイトへそのまま持っていけるか           | Component  |
| 動きの定義か                               | Animation  |
| このサイト固有のスタイルか                 | Project    |
| どの層も確実に上書きする必要があるか       | Utility    |

- `!important`はUtility層でのみ許可する
- 色とサイズの生値をコンポーネントに直接書かない。必ずTheme層の変数を経由すること
- フルード可変値は`calc(<最小値> * var(--px) + <差分> * var(--fluid))`の形で記述する。`--fluid`は基準ビューポートの下限で`0px`、上限で`1px`になる進行度を表す

```css
/* 例: 393px 時 13px、1440px 時 16px に可変する文字サイズ */
--font-size-label: calc(13 * var(--px) + 3 * var(--fluid));
```

### JavaScript・TypeScript

- `any`型の使用を禁止する
- クラスと共通関数にはJSDocを付与する

```ts
/**
 * @function localizePath
 * @description ルート識別子とロケールから公開URLのパスを組み立てる
 * @param {string} routeKey - ルート識別子
 * @param {Locale} locale - 対象ロケール
 * @returns {string} 末尾スラッシュ付きの絶対パス
 */
```

- 配列操作は`map`や`filter`などの非破壊メソッドを選択する
- `console.log`とデバッグコードはコミット前に削除する
- クライアントへJavaScriptを配信する変更は、必要性をPull Requestで説明すること。現状はメールコピー機能用の1ファイルのみで、本数と配信元（同一オリジン）をE2Eテストが検知する
- 新しく`<script>`を追加する場合、Astroは既定で4KB未満のscriptをHTMLにインライン展開するが、`netlify.toml`のCSPは`script-src 'self'`のみで`'unsafe-inline'`を許可していない。`astro.config.mjs`で`vite.build.assetsInlineLimit: 0`を設定済みのため通常は意識不要だが、インライン化を疑う不具合が出た場合はこの設定を確認すること

### 文言の追加

表示文言は`src/i18n/ui.ts`の辞書に追加します。日本語と英語の両方へキーを追加しないと型エラーになります。

---

## テスト

| 種別     | 対象                                 | コマンド            |
| -------- | ------------------------------------ | ------------------- |
| ユニット | 純粋関数（`src/i18n/`、`src/data/`） | `npm run test:unit` |
| E2E      | ページ表示、言語切り替え、表示品質   | `npm run test:e2e`  |

- Astroコンポーネントはサーバーサイドレンダリングのため、ユニットテストではなくE2Eテストで担保する
- ロジックが複雑になる場合は`src/i18n/`などの純粋関数へ切り出し、ユニットテストを書く
- カバレッジ目標はステートメント80%以上、関数90%以上

```sh
npm run test:unit:coverage
```

---

## Pull Requestプロセス

1. `develop`から`m〇〇/feature/#〇〇`ブランチを作成する
1. 実装してコミットする（Conventional Commits形式）
1. `npm run lint:fix`、`npm run format`、`npm run type-check`、`npm run test`をローカルで通す
1. Pull Requestを作成し、レビューを依頼する
1. Netlifyのデプロイプレビューで表示を確認する
1. レビュー合格後に`develop`へマージする

### コミットメッセージ形式

```
<type>(<scope>): <subject>

<body>

<footer>
```

`type`は`feat`、`fix`、`docs`、`style`、`refactor`、`test`、`chore`から選択します。

```
feat(top): 言語スイッチを追加

- jp と en の静的リンクで実装し、JavaScript を追加しない
- 表示中の言語は取り消し線で非活性であることを示す

Closes #12
```

---

## デザイン反映時の注意

- デザイン変更は原則としてトークン（`src/styles/tokens.css`と`src/styles/theme.css`）の変更で吸収する
- 字間とフォントサイズはFigmaの指定値を正とし、`--letter-spacing-*`と`--font-size-*`を更新する
- カンプとの差分を確認する際は、デスクトップを1440×1024、モバイルを393×852のビューポートで比較する

---

## トラブルシューティング

### `npm install`でエラーが発生する

```sh
rm -rf node_modules package-lock.json
npm install
```

### 開発サーバーが起動しない

ポート4321が使用中の可能性があります。

```sh
npm run dev -- --port 3000
```

### E2Eテストがサーバー起動待ちで失敗する

`astro preview`は非TTY環境だとバックグラウンド常駐に切り替わり、Playwrightからはプロセスが即終了したように見えます。テストは`npm run preview:ci`を使う設定になっているため、手動で起動したプレビューが残っている場合は停止してください。

```sh
npx astro preview stop
```

---

## 質問

不明点はissueで質問するか、プロジェクトリーダーへ相談してください。
