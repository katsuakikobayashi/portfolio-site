/**
 * microCMS のリッチテキスト（HTML 文字列）を、表示用の構造化テキストへ変換する。
 *
 * HTML をそのまま set:html で埋め込まず、「段落 → 行 → 文字の区切り」のデータに分解してから
 * Astro のテキストとして出力する（出力時に必ずエスケープされる）。
 * これにより、サニタイザを導入しなくても DOM ベースの XSS が構造的に起こらない（要件⑦）。
 *
 * 解釈するのは次の要素のみ。それ以外のタグは取り除き、中身のテキストだけを残す。
 * - 段落（p / div / 見出し / li など）: 段落の区切り
 * - br: 改行。連続した br（空行）は段落の区切り
 * - class 属性付きの要素（エディタのカスタムクラス）: 強調テキスト
 */

/** 文字の区切り。isEmphasized はカスタムクラスが付いた範囲かどうか */
export interface RichTextSegment {
  text: string
  isEmphasized: boolean
}

/** 1 行ぶんの文字の区切り */
export type RichTextLine = RichTextSegment[]

/** 1 段落ぶんの行 */
export type RichTextParagraph = RichTextLine[]

/** 段落を区切るブロック要素 */
const BLOCK_TAGS: ReadonlySet<string> = new Set([
  'p',
  'div',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'blockquote',
  'pre',
  'figure',
  'table',
  'tr',
  'hr',
])

/** 終了タグを持たない要素（スタックに積まない） */
const VOID_TAGS: ReadonlySet<string> = new Set(['br', 'hr', 'img', 'wbr', 'input', 'source'])

const TAG_PATTERN = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g
const COMMENT_PATTERN = /<!--[\s\S]*?-->/g
/** 空でない class 属性を持つか（`class=""` は対象外） */
const CLASS_ATTR_PATTERN = /\bclass\s*=\s*(?:"\s*[^"\s]|'\s*[^'\s]|[^\s"'>])/i
/**
 * 表示に不要な制御文字（改行・タブを除く C0 制御文字と DEL）。
 * CMS へのコピー＆ペーストで混入することがある（例: U+0003）。
 */
// eslint-disable-next-line no-control-regex -- 制御文字の除去が目的のため
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g
/** HTML ソース上の改行・連続空白は表示上 1 つの空白として扱う */
const WHITESPACE_RUN = /\s+/g

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}
const ENTITY_PATTERN = /&(?:#(\d+)|#x([0-9a-fA-F]+)|([a-zA-Z]+));/g
const MAX_CODE_POINT = 0x10ffff

/**
 * @function decodeEntity
 * @description 文字参照 1 つを文字に戻す。未知・不正な参照は元の文字列のまま残す
 * @param {string} entity - マッチした文字参照全体（例: '&amp;'）
 * @param {string | undefined} decimal - 10 進数値参照の数値部分
 * @param {string | undefined} hex - 16 進数値参照の数値部分
 * @param {string | undefined} name - 名前付き参照の名前部分
 * @returns {string} 復元した文字
 */
const decodeEntity = (
  entity: string,
  decimal: string | undefined,
  hex: string | undefined,
  name: string | undefined
): string => {
  if (name !== undefined) {
    return NAMED_ENTITIES[name] ?? entity
  }
  const codePoint = decimal !== undefined ? Number(decimal) : parseInt(hex ?? '', 16)
  return Number.isInteger(codePoint) && codePoint > 0 && codePoint <= MAX_CODE_POINT
    ? String.fromCodePoint(codePoint)
    : entity
}

/**
 * @function decodeHtmlText
 * @description HTML のテキストノードを表示用の文字列に戻す（文字参照の復元・制御文字の除去・空白の正規化）
 * @param {string} text - タグを含まない HTML テキスト
 * @returns {string} 表示用の文字列
 */
export const decodeHtmlText = (text: string): string =>
  text
    .replace(WHITESPACE_RUN, ' ')
    .replace(ENTITY_PATTERN, (entity, decimal?: string, hex?: string, name?: string) =>
      decodeEntity(entity, decimal, hex, name)
    )
    .replace(CONTROL_CHARS, '')

/**
 * @function mergeSegments
 * @description 強調の有無が同じ隣接区切りを 1 つに結合する（出力する span を最小限にする）
 * @param {RichTextLine} line - 結合前の行
 * @returns {RichTextLine} 結合後の行
 */
const mergeSegments = (line: RichTextLine): RichTextLine =>
  line.reduce<RichTextLine>((merged, segment) => {
    const previous = merged.at(-1)
    return previous && previous.isEmphasized === segment.isEmphasized
      ? [...merged.slice(0, -1), { ...previous, text: previous.text + segment.text }]
      : [...merged, segment]
  }, [])

/** 空白のみの区切りか */
const isBlank = (segment: RichTextSegment): boolean => segment.text.trim().length === 0

/**
 * @function trimLine
 * @description 行頭・行末の空白と空白のみの区切りを除き、隣接区切りを結合する
 * @param {RichTextLine} line - 整形前の行
 * @returns {RichTextLine} 整形後の行（空行なら空配列）
 */
const trimLine = (line: RichTextLine): RichTextLine => {
  const merged = mergeSegments(line)
  const first = merged.findIndex((segment) => !isBlank(segment))
  if (first < 0) {
    return []
  }
  const last = merged.findLastIndex((segment) => !isBlank(segment))
  const lastOffset = last - first
  return merged.slice(first, last + 1).map((segment, i) => {
    const trimmedStart = i === 0 ? segment.text.trimStart() : segment.text
    return { ...segment, text: i === lastOffset ? trimmedStart.trimEnd() : trimmedStart }
  })
}

/**
 * @function toParagraphs
 * @description 行の並び（空配列 = 段落区切り）を段落ごとにまとめる
 * @param {RichTextLine[]} lines - 区切りを含む行の並び
 * @returns {RichTextParagraph[]} 空でない段落の配列
 */
const toParagraphs = (lines: RichTextLine[]): RichTextParagraph[] =>
  lines
    .reduce<RichTextParagraph[]>(
      (paragraphs, line) =>
        line.length === 0
          ? [...paragraphs, []]
          : [...paragraphs.slice(0, -1), [...(paragraphs.at(-1) ?? []), line]],
      [[]]
    )
    .filter((paragraph) => paragraph.length > 0)

/**
 * @function parseRichText
 * @description リッチテキストの HTML を段落・行・文字の区切りに分解する
 * @param {string} html - microCMS のリッチテキストフィールドの値
 * @returns {RichTextParagraph[]} 段落の配列。各段落は行の配列、各行は文字の区切りの配列
 */
export const parseRichText = (html: string): RichTextParagraph[] => {
  const source = html.replace(COMMENT_PATTERN, '')
  /** 確定した行（空配列は段落区切り） */
  const lines: RichTextLine[] = []
  /** 開いている要素ごとの「カスタムクラスを持つか」 */
  const openElements: { tag: string; hasClass: boolean }[] = []
  const currentLine: RichTextLine = []

  const pushText = (raw: string): void => {
    const text = decodeHtmlText(raw)
    if (text.length > 0) {
      currentLine.push({ text, isEmphasized: openElements.some((el) => el.hasClass) })
    }
  }
  const breakLine = (): void => {
    lines.push(trimLine(currentLine))
    currentLine.splice(0)
  }
  const breakParagraph = (): void => {
    if (currentLine.length > 0) {
      breakLine()
    }
    lines.push([])
  }

  // ループ内で状態（開いている要素・現在の行）を更新しながら走査するため、
  // ここだけは命令的に書く。外へは新しい配列のみを返す。
  let cursor = 0
  for (const match of source.matchAll(TAG_PATTERN)) {
    pushText(source.slice(cursor, match.index))
    cursor = match.index + match[0].length

    const isClosing = match[1] === '/'
    const tag = (match[2] ?? '').toLowerCase()
    const attributes = match[3] ?? ''

    if (tag === 'br') {
      breakLine()
    } else if (BLOCK_TAGS.has(tag)) {
      breakParagraph()
    }

    if (isClosing) {
      const index = openElements.findLastIndex((el) => el.tag === tag)
      if (index >= 0) {
        openElements.splice(index)
      }
    } else if (!VOID_TAGS.has(tag) && !attributes.trimEnd().endsWith('/')) {
      openElements.push({ tag, hasClass: CLASS_ATTR_PATTERN.test(attributes) })
    }
  }
  pushText(source.slice(cursor))
  breakParagraph()

  return toParagraphs(lines)
}
