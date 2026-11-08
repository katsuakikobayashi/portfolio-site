/**
 * microCMS の API スキーマ定義。
 * 管理画面のフィールド ID と 1 対 1 で対応させること。
 */

/** microCMS の画像フィールド */
export interface MicrocmsImage {
  url: string
  width: number
  height: number
}

/** オブジェクト形式 API に共通で付与されるメタ情報 */
export interface MicrocmsObjectMeta {
  createdAt: string
  updatedAt: string
  publishedAt?: string
  revisedAt?: string
}

/** エンドポイント `top`（オブジェクト形式） */
export interface TopContent extends MicrocmsObjectMeta {
  slideImages: MicrocmsImage[]
}

/** エンドポイント `about`（オブジェクト形式） */
export interface AboutContent extends MicrocmsObjectMeta {
  image?: MicrocmsImage
  imageCaption?: string
  name: string
  nameEn: string
  text: string
  textEn: string
}

/** リスト形式 API の各コンテンツに付与されるメタ情報 */
export interface MicrocmsListItemMeta extends MicrocmsObjectMeta {
  id: string
}

/** リスト形式 API のレスポンス */
export interface MicrocmsListResponse<T> {
  contents: T[]
  totalCount: number
  offset: number
  limit: number
}

/**
 * エンドポイント `projects`（リスト形式）の 1 件。
 * body / bodyEn はリッチテキストエディタの HTML（lib/rich-text.ts でテキストとして解釈する）。
 */
export interface ProjectContent extends MicrocmsListItemMeta {
  title: string
  /** 詳細ページの URL スラッグ（/projects/{url}/） */
  url: string
  year?: string
  description?: string
  thumbnail?: MicrocmsImage
  images?: MicrocmsImage[]
  body?: string
  bodyEn?: string
}

/** エンドポイント名とレスポンス型の対応表 */
export interface MicrocmsEndpoints {
  top: TopContent
  about: AboutContent
  projects: MicrocmsListResponse<ProjectContent>
}

export type MicrocmsEndpoint = keyof MicrocmsEndpoints
