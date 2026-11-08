import { describe, expect, it } from 'vitest'
import { getBorderBlockSize } from './project-caption'

/** 計測結果のうち、テストで使う値だけを持つオブジェクトを作る */
const createEntry = (borderBlockSizes: number[], contentHeight: number) => ({
  borderBoxSize: borderBlockSizes.map((blockSize) => ({ blockSize, inlineSize: 0 })),
  contentRect: { height: contentHeight } as DOMRectReadOnly,
})

describe('getBorderBlockSize', () => {
  it('ボーダーボックスの高さを返す', () => {
    expect(getBorderBlockSize(createEntry([420.5], 400))).toBe(420.5)
  })

  it('borderBoxSize が空なら contentRect の高さで代替する', () => {
    expect(getBorderBlockSize(createEntry([], 400))).toBe(400)
  })
})
