import { describe, expect, it } from 'vitest'
import { ABOUT_PHOTO, PROJECT_IMAGE, TOP_SLIDE } from '@/data/media'
import type { AboutContent, ProjectContent } from '@/lib/microcms/types'
import type { Project } from '@/lib/project'
import {
  toAboutView,
  toMediaRatio,
  toProjectPageTitle,
  toProjectView,
  toTopSlides,
} from './page-content'

const image = { url: 'https://images.microcms-assets.io/a.jpg', width: 1200, height: 1600 }

const about: AboutContent = {
  createdAt: '',
  updatedAt: '',
  name: '小林 克彰',
  nameEn: 'Katsuaki Kobayashi',
  text: '一行目\n二行目\n\n二段落目',
  textEn: 'Line one\nline two\n\nSecond',
  image,
  imageCaption: 'Photo: someone',
}

const project: Project = {
  id: 'abc',
  slug: 'project_1',
  title: 'Project 1',
  year: '2026',
  description: 'desc',
  images: [image, { ...image, width: 1600, height: 900 }],
  body: { ja: '<p>日本語</p>', en: '<p>English</p>' },
}

/** `top.sliderImages` が参照する projects の 1 件 */
const referencedProject: ProjectContent = {
  id: 'abc',
  createdAt: '',
  updatedAt: '',
  title: 'House in Kinuta',
  url: 'project_1',
  thumbnail: { ...image, url: 'https://images.microcms-assets.io/thumbnail.jpg' },
  images: [image],
}

describe('toTopSlides', () => {
  it('参照先のサムネイルを TOP の表示サイズで変換し、詳細ページへのリンクを付ける', () => {
    const [slide] = toTopSlides({ sliderImages: [referencedProject] }, 'ja')
    expect(slide?.title).toBe('House in Kinuta')
    expect(slide?.href).toBe('/projects/project_1/')
    expect(slide?.image.src).toContain('thumbnail.jpg')
    expect(slide?.image.width).toBe(TOP_SLIDE.displayWidth)
    expect(slide?.image.sizes).toBe(TOP_SLIDE.sizes)
  })

  it('リンク先はロケールに合わせる', () => {
    const [slide] = toTopSlides({ sliderImages: [referencedProject] }, 'en')
    expect(slide?.href).toBe('/en/projects/project_1/')
  })

  it('サムネイルが未入力なら詳細ページの 1 枚目を使い、写真が無ければ除外する', () => {
    const withoutImages: ProjectContent = {
      id: 'def',
      createdAt: '',
      updatedAt: '',
      title: 'No Image',
      url: 'project_2',
    }
    const withoutThumbnail: ProjectContent = { ...withoutImages, images: [image] }
    const slides = toTopSlides({ sliderImages: [withoutThumbnail, withoutImages] }, 'ja')
    expect(slides).toHaveLength(1)
    expect(slides[0]?.image.src).toContain('a.jpg')
  })

  it('参照先の url が不正ならエラーにする', () => {
    expect(() =>
      toTopSlides({ sliderImages: [{ ...referencedProject, url: '../about' }] }, 'ja')
    ).toThrow()
  })
})

describe('toAboutView', () => {
  it('日本語は name / text を使い、description は行をそのまま連結する', () => {
    const view = toAboutView(about, 'ja')
    expect(view.name).toBe('小林 克彰')
    expect(view.paragraphs).toEqual([['一行目', '二行目'], ['二段落目']])
    expect(view.description).toBe('一行目二行目')
    expect(view.photo?.width).toBe(ABOUT_PHOTO.displayWidth)
    expect(view.photoCaption).toBe('Photo: someone')
  })

  it('英語は nameEn / textEn を使い、description は空白で連結する', () => {
    const view = toAboutView(about, 'en')
    expect(view.name).toBe('Katsuaki Kobayashi')
    expect(view.description).toBe('Line one line two')
  })

  it('写真が未入力なら photo は undefined', () => {
    const withoutImage: AboutContent = Object.fromEntries(
      Object.entries(about).filter(([key]) => key !== 'image')
    ) as AboutContent
    expect(toAboutView(withoutImage, 'ja').photo).toBeUndefined()
  })
})

describe('toProjectView', () => {
  it('ロケールの本文を構造化し、写真を詳細ページの表示サイズで変換する', () => {
    const view = toProjectView(project, 'en')
    expect(view.title).toBe('Project 1')
    expect(view.paragraphs).toEqual([[[{ text: 'English', isEmphasized: false }]]])
    expect(view.images).toHaveLength(2)
    expect(view.images[0]?.width).toBe(PROJECT_IMAGE.displayWidth)
  })
})

describe('toProjectPageTitle', () => {
  it('プロジェクト名・一覧名・サイト名を連結する', () => {
    expect(toProjectPageTitle('Project 1', 'ja')).toBe('Project 1 | Projects | Katsuaki Kobayashi')
  })
})

describe('toMediaRatio', () => {
  it('写真の高さ / 幅を返し、写真が無ければ 1 を返す', () => {
    const [portrait] = toProjectView(project, 'ja').images
    expect(toMediaRatio(portrait)).toBeCloseTo(1600 / 1200)
    expect(toMediaRatio(undefined)).toBe(1)
  })
})
