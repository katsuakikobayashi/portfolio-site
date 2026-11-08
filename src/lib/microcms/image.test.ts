import { describe, expect, it } from 'vitest'
import { DPR_QUALITY, DPRS, buildImageUrl, buildResponsiveImage } from './image'

const SOURCE = 'https://images.microcms-assets.io/assets/abc/def/photo.jpg'

describe('buildImageUrl', () => {
  it('WebP・表示幅・DPR・画質のパラメータを付与する', () => {
    const url = new URL(buildImageUrl(SOURCE, { width: 375, dpr: 2 }))
    expect(url.origin + url.pathname).toBe(SOURCE)
    expect(url.searchParams.get('fm')).toBe('webp')
    expect(url.searchParams.get('w')).toBe('375')
    expect(url.searchParams.get('dpr')).toBe('2')
    expect(url.searchParams.get('q')).toBe(String(DPR_QUALITY[2]))
  })

  it('表示幅の端数を丸める', () => {
    expect(new URL(buildImageUrl(SOURCE, { width: 300.4, dpr: 1 })).searchParams.get('w')).toBe(
      '300'
    )
  })
})

describe('DPR_QUALITY', () => {
  it('DPR が高いほど画質を下げる', () => {
    const qualities = DPRS.map((dpr) => DPR_QUALITY[dpr])
    expect(qualities).toEqual([...qualities].sort((a, b) => b - a))
  })
})

describe('buildResponsiveImage', () => {
  const image = { url: SOURCE, width: 1875, height: 2500 }

  it('1x〜3x の候補を実ピクセル幅の w 記述子で並べる', () => {
    const result = buildResponsiveImage(image, 375, '375px')
    const descriptors = result.srcset.split(', ').map((candidate) => candidate.split(' ')[1])
    expect(descriptors).toEqual(['375w', '750w', '1125w'])
    expect(result.sizes).toBe('375px')
  })

  it('src は 1x の URL を指す', () => {
    const result = buildResponsiveImage(image, 375, '375px')
    expect(new URL(result.src).searchParams.get('dpr')).toBe('1')
  })

  it('元画像の比率から width / height を算出する（CLS 対策）', () => {
    const result = buildResponsiveImage(image, 375, '375px')
    expect(result.width).toBe(375)
    expect(result.height).toBe(500)
  })

  it('元画像より大きくなる DPR の候補は除外する', () => {
    const small = { url: SOURCE, width: 800, height: 1000 }
    const descriptors = buildResponsiveImage(small, 375, '375px')
      .srcset.split(', ')
      .map((candidate) => candidate.split(' ')[1])
    expect(descriptors).toEqual(['375w', '750w'])
  })

  it('元画像が表示幅より小さくても 1x の候補は必ず残す', () => {
    const tiny = { url: SOURCE, width: 200, height: 300 }
    expect(buildResponsiveImage(tiny, 375, '375px').srcset.split(', ')).toHaveLength(1)
  })
})
