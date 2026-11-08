import { describe, expect, it } from 'vitest'
import { toDescription, toParagraphs } from './text'

describe('toParagraphs', () => {
  it('空行で段落、単一改行で行に分割する', () => {
    expect(toParagraphs('a\nb\n\nc')).toEqual([['a', 'b'], ['c']])
  })

  it('行末スペースを含む空行や CRLF も段落区切りとして扱う', () => {
    expect(toParagraphs('a \r\n \r\nb')).toEqual([['a'], ['b']])
  })

  it('3 行以上の連続改行でも空段落を作らない', () => {
    expect(toParagraphs('a\n\n\n\nb')).toEqual([['a'], ['b']])
  })

  it('HTML を解釈せず文字列のまま返す', () => {
    expect(toParagraphs('<script>alert(1)</script>')).toEqual([['<script>alert(1)</script>']])
  })

  it('空文字は空配列を返す', () => {
    expect(toParagraphs('')).toEqual([])
  })
})

describe('toDescription', () => {
  it('先頭段落の行を指定の文字で連結する', () => {
    expect(toDescription('Born in Fukui.\nAfter graduating.\n\nSecond.', ' ')).toBe(
      'Born in Fukui. After graduating.'
    )
    expect(toDescription('1997年生まれ。\n独立。\n\n次。', '')).toBe('1997年生まれ。独立。')
  })

  it('本文が空なら空文字を返す', () => {
    expect(toDescription('', ' ')).toBe('')
  })
})
