/**
 * CMS から受け取ったプレーンテキストを表示用に整形する関数群。
 * HTML として解釈せず文字列のまま扱うことで、DOM ベースの XSS を構造的に排除する。
 */

/** 段落の区切り（空行）。CMS 入力時の行末スペースや CRLF も許容する */
const PARAGRAPH_SEPARATOR = /\r?\n[ \t\u3000]*\r?\n/
const LINE_SEPARATOR = /\r?\n/

/**
 * @function toParagraphs
 * @description 空行区切りで段落に、単一改行で行に分割する。
 *              各行の前後空白は除去し、空の段落は捨てる。
 * @param {string} text - CMS のテキストエリアの値
 * @returns {string[][]} 段落ごとの行配列
 */
export const toParagraphs = (text: string): string[][] =>
  text
    .split(PARAGRAPH_SEPARATOR)
    .map((paragraph) =>
      paragraph
        .split(LINE_SEPARATOR)
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
    )
    .filter((lines) => lines.length > 0)

/**
 * @function toDescription
 * @description 先頭段落を 1 行に連結し、meta description 用の文字列を作る
 * @param {string} text - CMS のテキストエリアの値
 * @param {string} lineJoiner - 行同士をつなぐ文字（和文は ''、欧文は ' '）
 * @returns {string} 先頭段落を連結した文字列。本文が空なら空文字
 */
export const toDescription = (text: string, lineJoiner: string): string => {
  const [first] = toParagraphs(text)
  return first ? first.join(lineJoiner) : ''
}
