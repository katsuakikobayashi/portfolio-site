import { describe, expect, it } from 'vitest'
import { addLowFetchPriority } from './script-priority'

const BUNDLED = '<script type="module" src="/_astro/BaseLayout.astro_ast.C6zGTKdt.js"></script>'

describe('addLowFetchPriority', () => {
  it('バンドル済み module script に fetchpriority="low" を付与する', () => {
    expect(addLowFetchPriority(`<body>${BUNDLED}</body>`)).toBe(
      '<body><script type="module" fetchpriority="low" src="/_astro/BaseLayout.astro_ast.C6zGTKdt.js"></script></body>'
    )
  })

  it('すでに fetchpriority を持つタグは変更しない', () => {
    const html = '<script type="module" fetchpriority="high" src="/_astro/a.js"></script>'
    expect(addLowFetchPriority(html)).toBe(html)
  })

  it('二重に付与しない（何度実行しても結果が同じ）', () => {
    const once = addLowFetchPriority(BUNDLED)
    expect(addLowFetchPriority(once)).toBe(once)
  })

  it('外部オリジンのスクリプトや JSON-LD は変更しない', () => {
    const html = [
      '<script type="module" src="https://example.com/a.js"></script>',
      '<script type="application/ld+json">{}</script>',
      '<script async src="https://www.googletagmanager.com/gtm.js"></script>',
    ].join('')
    expect(addLowFetchPriority(html)).toBe(html)
  })

  it('複数のタグをすべて対象にする', () => {
    const html = `${BUNDLED}${BUNDLED.replace('C6zGTKdt', 'Other123')}`
    expect(addLowFetchPriority(html).match(/fetchpriority="low"/g)).toHaveLength(2)
  })
})
