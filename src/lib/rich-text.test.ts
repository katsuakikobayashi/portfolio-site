import { describe, expect, it } from 'vitest'
import { decodeHtmlText, parseRichText, type RichTextParagraph } from './rich-text'

/** 強調なしの段落を簡潔に書くためのヘルパー */
const plain = (...lines: string[]): RichTextParagraph =>
  lines.map((text) => [{ text, isEmphasized: false }])

describe('decodeHtmlText', () => {
  it('名前付き・数値の文字参照を復元する', () => {
    expect(decodeHtmlText('A &amp; B &lt;C&gt; &#169; &#x2014;')).toBe('A & B <C> © —')
  })

  it('未知・範囲外の文字参照はそのまま残す', () => {
    expect(decodeHtmlText('&unknown; &#0; &#x110000;')).toBe('&unknown; &#0; &#x110000;')
  })

  it('CMS に混入した制御文字を除去する', () => {
    expect(decodeHtmlText('Kengaku (1-7),\u0003')).toBe('Kengaku (1-7),')
  })

  it('HTML ソース上の改行や連続空白は 1 つの空白にまとめる', () => {
    expect(decodeHtmlText('a\n  b')).toBe('a b')
  })
})

describe('parseRichText', () => {
  it('br を改行、連続した br（空行）を段落区切りとして扱う', () => {
    const html = '<p>Residence / Tokyo<br>-<br><br>Architect: <br>KENTA &amp; ASSOCIATES</p>'
    expect(parseRichText(html)).toEqual([
      plain('Residence / Tokyo', '-'),
      plain('Architect:', 'KENTA & ASSOCIATES'),
    ])
  })

  it('p 要素ごとに段落を分ける', () => {
    expect(parseRichText('<p>one</p><p>two</p>')).toEqual([plain('one'), plain('two')])
  })

  it('カスタムクラス付きの範囲だけを強調として区別する', () => {
    const html =
      '<p><span class="caption">強調</span>通常<br><span class="caption">次の行</span></p>'
    expect(parseRichText(html)).toEqual([
      [
        [
          { text: '強調', isEmphasized: true },
          { text: '通常', isEmphasized: false },
        ],
        [{ text: '次の行', isEmphasized: true }],
      ],
    ])
  })

  it('入れ子の内側もカスタムクラスの範囲として扱い、閉じた後は通常に戻る', () => {
    const html = '<p><span class="caption">a<strong>b</strong></span>c</p>'
    expect(parseRichText(html)).toEqual([
      [
        [
          { text: 'ab', isEmphasized: true },
          { text: 'c', isEmphasized: false },
        ],
      ],
    ])
  })

  it('空の class 属性は強調にしない', () => {
    expect(parseRichText('<p><span class="">a</span></p>')).toEqual([plain('a')])
  })

  it('script などのタグは解釈せず、テキストとしてのみ残す', () => {
    const result = parseRichText('<p><script>alert(1)</script><img src=x onerror=alert(1)>ok</p>')
    expect(result).toEqual([plain('alert(1)ok')])
  })

  it('文字参照で書かれたタグは復元してもテキストのまま扱う', () => {
    expect(parseRichText('<p>&lt;b&gt;x&lt;/b&gt;</p>')).toEqual([plain('<b>x</b>')])
  })

  it('HTML コメントを除去する', () => {
    expect(parseRichText('<p>a<!-- memo -->b</p>')).toEqual([plain('ab')])
  })

  it('行頭・行末の空白と空白だけの行を取り除く', () => {
    expect(parseRichText('<p>  a  <br> <br>b </p>')).toEqual([plain('a'), plain('b')])
  })

  it('タグのないテキストも 1 段落として扱う', () => {
    expect(parseRichText('text only')).toEqual([plain('text only')])
  })

  it('空文字は空配列を返す', () => {
    expect(parseRichText('')).toEqual([])
  })
})
