import { describe, expect, it } from 'vitest'
import {
  CANDIDATE_WIDTH_STEP,
  DPRS,
  DPR_QUALITY,
  FALLBACK_FORMAT,
  IMAGE_FORMATS,
  MAX_CANDIDATE_WIDTH,
  MIN_CANDIDATE_WIDTH,
  buildCandidateWidths,
  buildImageUrl,
  buildResponsiveImage,
  buildSrcset,
  getPreferredSource,
  qualityForWidth,
  SOURCE_FORMATS,
} from './image'

const SOURCE = 'https://images.microcms-assets.io/assets/abc/def/photo.jpg'

/**
 * @function parseSrcset
 * @description srcset 文字列を URL と w 記述子の組に分解する
 * @param {string} srcset - srcset 属性値
 * @returns {{ url: URL, descriptor: string }[]} 候補の配列
 */
const parseSrcset = (srcset: string): { url: URL; descriptor: string }[] =>
  srcset.split(', ').map((candidate) => {
    const [url = '', descriptor = ''] = candidate.split(' ')
    return { url: new URL(url), descriptor }
  })

describe('buildImageUrl', () => {
  it('フォーマット・配信幅・画質のパラメータを付与し、dpr は付けない', () => {
    const url = new URL(buildImageUrl(SOURCE, { width: 720, quality: 60, format: 'webp' }))
    expect(url.origin + url.pathname).toBe(SOURCE)
    expect(url.searchParams.get('fm')).toBe('webp')
    expect(url.searchParams.get('w')).toBe('720')
    expect(url.searchParams.get('q')).toBe('60')
    expect(url.searchParams.has('dpr')).toBe(false)
  })

  it('AVIF を指定できる', () => {
    const url = new URL(buildImageUrl(SOURCE, { width: 720, quality: 60, format: 'avif' }))
    expect(url.searchParams.get('fm')).toBe('avif')
  })

  it('配信幅の端数を丸める', () => {
    expect(
      new URL(
        buildImageUrl(SOURCE, { width: 300.4, quality: 80, format: 'webp' })
      ).searchParams.get('w')
    ).toBe('300')
  })
})

describe('DPR_QUALITY', () => {
  it('DPR が高いほど画質を下げる', () => {
    const qualities = DPRS.map((dpr) => DPR_QUALITY[dpr])
    expect(qualities).toEqual([...qualities].sort((a, b) => b - a))
  })
})

describe('qualityForWidth', () => {
  it('表示幅との比率に最も近い DPR の画質を返す', () => {
    expect(qualityForWidth(450, 450)).toBe(DPR_QUALITY[1])
    expect(qualityForWidth(720, 450)).toBe(DPR_QUALITY[2])
    expect(qualityForWidth(1260, 450)).toBe(DPR_QUALITY[3])
  })

  it('1x 未満は 1x、3x 超は 3x の画質として扱う', () => {
    expect(qualityForWidth(360, 450)).toBe(DPR_QUALITY[1])
    expect(qualityForWidth(1980, 450)).toBe(DPR_QUALITY[3])
  })
})

describe('buildCandidateWidths', () => {
  it('最小幅から一定間隔で上限まで並べる', () => {
    const widths = buildCandidateWidths(4000)
    expect(widths.at(0)).toBe(MIN_CANDIDATE_WIDTH)
    expect(widths.at(-1)).toBe(MAX_CANDIDATE_WIDTH)
    expect(widths.slice(1).map((width, i) => width - (widths[i] ?? 0))).toEqual(
      widths.slice(1).map(() => CANDIDATE_WIDTH_STEP)
    )
  })

  it('元画像を超える幅は除外し、元画像の幅を最大候補に加える', () => {
    expect(buildCandidateWidths(1000)).toEqual([360, 540, 720, 900, 1000])
  })

  it('元画像の幅が候補と一致する場合は重複させない', () => {
    expect(buildCandidateWidths(900)).toEqual([360, 540, 720, 900])
  })

  it('元画像が最小幅より小さくても 1 件は必ず返す', () => {
    expect(buildCandidateWidths(200)).toEqual([200])
  })
})

describe('buildSrcset', () => {
  const image = { url: SOURCE, width: 1875, height: 2500 }

  it('全候補を指定フォーマットで配信する', () => {
    const candidates = parseSrcset(buildSrcset(image, 450, 'avif'))
    expect(candidates.length).toBe(buildCandidateWidths(image.width).length)
    candidates.forEach(({ url }) => expect(url.searchParams.get('fm')).toBe('avif'))
  })
})

describe('buildResponsiveImage', () => {
  const image = { url: SOURCE, width: 1875, height: 2500 }

  it('優先フォーマット（AVIF）の <source> を優先度順に持つ', () => {
    const { sources } = buildResponsiveImage(image, 450, '450px')
    expect(sources.map(({ type }) => type)).toEqual(
      SOURCE_FORMATS.map((format) => IMAGE_FORMATS[format])
    )
    expect(sources.map(({ type }) => type)).toContain('image/avif')
    sources.forEach(({ srcset }, i) => {
      const format = SOURCE_FORMATS[i]
      parseSrcset(srcset).forEach(({ url }) => expect(url.searchParams.get('fm')).toBe(format))
    })
  })

  it('<source> と <img> の候補幅・画質を揃える（フォーマットのみ異なる）', () => {
    const result = buildResponsiveImage(image, 450, '450px')
    const toWidthAndQuality = (srcset: string): string[] =>
      parseSrcset(srcset).map(
        ({ url, descriptor }) =>
          `${url.searchParams.get('w')}/${url.searchParams.get('q')}/${descriptor}`
      )
    result.sources.forEach(({ srcset }) =>
      expect(toWidthAndQuality(srcset)).toEqual(toWidthAndQuality(result.srcset))
    )
  })

  it('<img> の src / srcset はフォールバック（WebP）で配信する', () => {
    const result = buildResponsiveImage(image, 450, '450px')
    expect(new URL(result.src).searchParams.get('fm')).toBe(FALLBACK_FORMAT)
    parseSrcset(result.srcset).forEach(({ url }) =>
      expect(url.searchParams.get('fm')).toBe(FALLBACK_FORMAT)
    )
  })

  it('候補幅を実ピクセル幅の w 記述子で並べる', () => {
    const result = buildResponsiveImage(image, 450, '450px')
    const candidates = parseSrcset(result.srcset)
    expect(candidates.map(({ descriptor }) => descriptor)).toEqual(
      buildCandidateWidths(image.width).map((width) => `${width}w`)
    )
    expect(candidates.map(({ url }) => url.searchParams.get('w'))).toEqual(
      buildCandidateWidths(image.width).map(String)
    )
    expect(result.sizes).toBe('450px')
  })

  it('SP（表示 347px × DPR 2 = 694px）で 900w ではなく 720w を選べる候補を含む', () => {
    const descriptors = parseSrcset(buildResponsiveImage(image, 450, '450px').srcset).map(
      ({ descriptor }) => descriptor
    )
    expect(descriptors).toContain('720w')
  })

  it('各候補の画質を表示幅との比率から決める', () => {
    const candidates = parseSrcset(buildResponsiveImage(image, 450, '450px').srcset)
    candidates.forEach(({ url }) => {
      const width = Number(url.searchParams.get('w'))
      expect(url.searchParams.get('q')).toBe(String(qualityForWidth(width, 450)))
    })
  })

  it('src は表示幅（1x）の画質で配信する', () => {
    const src = new URL(buildResponsiveImage(image, 375, '375px').src)
    expect(src.searchParams.get('w')).toBe('375')
    expect(src.searchParams.get('q')).toBe(String(DPR_QUALITY[1]))
  })

  it('元画像が表示幅より小さい場合、src は元画像の幅で配信する', () => {
    const tiny = { url: SOURCE, width: 200, height: 300 }
    expect(new URL(buildResponsiveImage(tiny, 375, '375px').src).searchParams.get('w')).toBe('200')
  })

  it('元画像の比率から width / height を算出する（CLS 対策）', () => {
    const result = buildResponsiveImage(image, 375, '375px')
    expect(result.width).toBe(375)
    expect(result.height).toBe(500)
  })
})

describe('getPreferredSource', () => {
  const image = buildResponsiveImage({ url: SOURCE, width: 1875, height: 2500 }, 450, '450px')

  it('最優先の <source> を返す', () => {
    const [first] = image.sources
    expect(getPreferredSource(image)).toEqual(first)
  })

  it('<source> が無い場合は <img> の srcset と MIME タイプを返す', () => {
    expect(getPreferredSource({ ...image, sources: [] })).toEqual({
      type: IMAGE_FORMATS[FALLBACK_FORMAT],
      srcset: image.srcset,
    })
  })
})
