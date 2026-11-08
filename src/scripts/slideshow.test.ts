import { describe, expect, it } from 'vitest'
import { getNextIndex } from './slideshow'

describe('getNextIndex', () => {
  it('次のスライドに進む', () => {
    expect(getNextIndex(0, 3)).toBe(1)
  })

  it('最後のスライドの次は先頭に戻る', () => {
    expect(getNextIndex(2, 3)).toBe(0)
  })
})
