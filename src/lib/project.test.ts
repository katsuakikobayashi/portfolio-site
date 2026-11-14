import { describe, expect, it } from 'vitest'
import type { ProjectContent } from '@/lib/microcms/types'
import {
  toProject,
  toProjectPath,
  toProjectSlug,
  toProjectStaticPaths,
  toProjects,
} from './project'

const IMAGE = { url: 'https://images.microcms-assets.io/a.jpg', width: 1875, height: 2500 }

/** 必須項目のみを持つ CMS の 1 件を作る */
const createContent = (overrides: Partial<ProjectContent> = {}): ProjectContent => ({
  id: 'id-1',
  createdAt: '2026-11-08T00:00:00.000Z',
  updatedAt: '2026-11-08T00:00:00.000Z',
  title: 'House in Kinuta',
  url: 'project_1',
  ...overrides,
})

describe('toProjectSlug', () => {
  it('英数字・ハイフン・アンダースコアを受け付け、前後の空白を除く', () => {
    expect(toProjectSlug(' house-in_Kinuta01 ', 'x')).toBe('house-in_Kinuta01')
  })

  it.each(['', '../secret', 'a/b', 'a b', '日本語', 'a?b'])(
    'パスとして不正な値 "%s" はエラーにする',
    (url) => {
      expect(() => toProjectSlug(url, 'House')).toThrow('House')
    }
  )
})

describe('toProject', () => {
  it('CMS の値をページ用の形に変換する', () => {
    const project = toProject(
      createContent({
        year: ' 2026 ',
        description: 'Custom furniture design',
        thumbnail: IMAGE,
        images: [IMAGE],
        body: '<p>ja</p>',
        bodyEn: '<p>en</p>',
      })
    )
    expect(project).toEqual({
      id: 'id-1',
      slug: 'project_1',
      title: 'House in Kinuta',
      year: '2026',
      description: 'Custom furniture design',
      thumbnail: IMAGE,
      images: [IMAGE],
      body: { ja: '<p>ja</p>', en: '<p>en</p>' },
    })
  })

  it('任意項目が未入力でも空文字・空配列で扱える', () => {
    const project = toProject(createContent())
    expect(project.year).toBe('')
    expect(project.description).toBe('')
    expect(project.images).toEqual([])
    expect(project.thumbnail).toBeUndefined()
    expect(project.body).toEqual({ ja: '', en: '' })
  })

  it('英語の本文が空なら日本語の本文で代替する', () => {
    expect(toProject(createContent({ body: '<p>ja</p>', bodyEn: ' ' })).body.en).toBe('<p>ja</p>')
  })
})

describe('toProjects', () => {
  it('API の並び順（公開日の新しい順）を維持する', () => {
    const projects = toProjects([
      createContent({ id: 'new', url: 'b' }),
      createContent({ id: 'old', url: 'a' }),
    ])
    expect(projects.map((project) => project.id)).toEqual(['new', 'old'])
  })

  it('url が重複していればエラーにする', () => {
    expect(() =>
      toProjects([createContent({ id: '1', url: 'same' }), createContent({ id: '2', url: 'same' })])
    ).toThrow('same')
  })

  it('空の一覧は空配列を返す', () => {
    expect(toProjects([])).toEqual([])
  })
})

describe('toProjectStaticPaths', () => {
  it('slug をパラメータ、プロジェクトを props にしたパスを返す', () => {
    const projects = toProjects([createContent({ url: 'project_1' })])
    expect(toProjectStaticPaths(projects)).toEqual([
      { params: { slug: 'project_1' }, props: { project: projects[0] } },
    ])
  })
})

describe('toProjectPath', () => {
  it('ロケールごとの詳細ページのパスを返す', () => {
    expect(toProjectPath('project_1', 'ja')).toBe('/projects/project_1/')
    expect(toProjectPath('project_1', 'en')).toBe('/en/projects/project_1/')
  })
})
