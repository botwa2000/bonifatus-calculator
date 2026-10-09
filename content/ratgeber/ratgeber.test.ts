import { describe, expect, it } from 'vitest'
import { RATGEBER_INDEX } from '@/content/ratgeber/index'
import { getRatgeberArticle, registryKeys } from '@/content/ratgeber/registry'
import type { RatgeberArticle } from '@/content/ratgeber/types'
import { PUBLIC_PAGES, getPublicPage } from '@/lib/seo/routes'
import { plainText } from '@/components/ratgeber/RichText'

function allText(a: RatgeberArticle): string[] {
  const texts = [...a.intro]
  for (const s of a.sections) {
    texts.push(s.heading)
    for (const b of s.blocks) {
      if (b.type === 'p' || b.type === 'callout') texts.push(b.text)
      if (b.type === 'ul' || b.type === 'ol') texts.push(...b.items)
      if (b.type === 'table') texts.push(...b.head, ...b.rows.flat(), b.note ?? '')
      if (b.type === 'djiAllowanceTable') texts.push(b.note ?? '')
    }
  }
  for (const f of a.faqs) texts.push(f.question, f.answer)
  return texts
}

const articles = RATGEBER_INDEX.map((m) => getRatgeberArticle(m.locale, m.slug)!)

describe('Ratgeber registry', () => {
  it('has a body for every indexed article and no orphan bodies', () => {
    const { indexed, bodies } = registryKeys()
    expect(bodies).toEqual(indexed)
  })

  it('registers the hub and every article as indexable in its own locale only', () => {
    expect(getPublicPage('/ratgeber')?.locales).toEqual(['de'])
    for (const a of articles) {
      expect(getPublicPage(`/ratgeber/${a.slug}`)?.locales).toEqual([a.locale])
      expect(getPublicPage(`/ratgeber/${a.slug}`)?.lastModified).toBe(a.updatedAt)
    }
  })
})

describe.each(articles.map((a) => [a.slug, a] as const))('article %s', (_slug, article) => {
  const texts = allText(article)

  it('cites only existing sources and cites every source', () => {
    const cited = new Set<number>()
    for (const text of texts) {
      for (const m of text.matchAll(/\[\^(\d+)\]/g)) cited.add(Number(m[1]))
    }
    for (const n of cited) {
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(article.sources.length)
    }
    expect(cited.size).toBe(article.sources.length)
  })

  it('links internally only to registered pages', () => {
    const registered = new Set(PUBLIC_PAGES.map((p) => p.path))
    for (const text of texts) {
      for (const m of text.matchAll(/\]\((\/[^)\s]*)\)/g)) expect(registered).toContain(m[1])
    }
    expect(registered).toContain(article.cta.href)
  })

  it('uses https sources and has exactly one CTA block', () => {
    for (const s of article.sources) expect(s.url).toMatch(/^https:\/\//)
    const ctas = article.sections.flatMap((s) => s.blocks).filter((b) => b.type === 'cta')
    expect(ctas).toHaveLength(1)
  })

  it('links related articles that exist', () => {
    for (const slug of article.related) {
      expect(getRatgeberArticle(article.locale, slug)).not.toBeNull()
    }
  })

  it('is a substantial read (800–1300 words)', () => {
    const words = texts.map(plainText).join(' ').split(/\s+/).filter(Boolean).length
    expect(words).toBeGreaterThanOrEqual(800)
    expect(words).toBeLessThanOrEqual(1300)
  })
})
