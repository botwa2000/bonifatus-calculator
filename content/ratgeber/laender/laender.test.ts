import { describe, expect, it } from 'vitest'
import { LAND_DRAFTS } from '@/content/ratgeber/laender/drafts'
import { LAND_PAGES, draftTexts, getLandPageBySlug, landPath } from '@/content/ratgeber/laender'
import { LAND_SOURCES } from '@/content/ratgeber/laender/sources'
import { LAND_COPY } from '@/content/ratgeber/laender/copy'
import { getRatgeberArticle } from '@/content/ratgeber/registry'
import { PUBLIC_PAGES, getPublicPage } from '@/lib/seo/routes'
import { plainText } from '@/components/ratgeber/RichText'

const LAENDER = [
  'Baden-Württemberg',
  'Bayern',
  'Berlin',
  'Brandenburg',
  'Bremen',
  'Hamburg',
  'Hessen',
  'Mecklenburg-Vorpommern',
  'Niedersachsen',
  'Nordrhein-Westfalen',
  'Rheinland-Pfalz',
  'Saarland',
  'Sachsen',
  'Sachsen-Anhalt',
  'Schleswig-Holstein',
  'Thüringen',
]

const words = (texts: string[]) =>
  new Set(
    texts
      .map(plainText)
      .join(' ')
      .toLowerCase()
      .split(/[^a-zäöüß0-9]+/)
      .filter((w) => w.length > 3)
  )

describe('Halbjahreszeugnis pages per Land', () => {
  it('has one page per Land, alphabetical, with a URL of the form halbjahreszeugnis-<land>', () => {
    expect(LAND_PAGES.map((p) => p.name)).toEqual(LAENDER)
    for (const p of LAND_PAGES) {
      expect(p.path).toMatch(/^\/ratgeber\/halbjahreszeugnis-[a-z-]+$/)
      expect(getLandPageBySlug(p.path.split('/').at(-1)!)).toBe(p)
    }
  })

  it('titles match the query', () => {
    for (const p of LAND_PAGES)
      expect(p.title).toBe(`Halbjahreszeugnis ${p.name} 2027: Termin & Ferien`)
    expect(LAND_PAGES.find((p) => p.slug === 'berlin')?.title).toBe(
      'Halbjahreszeugnis Berlin 2027: Termin & Ferien'
    )
  })

  it('are registered in routes.ts (and so the sitemap), German only', () => {
    for (const p of LAND_PAGES) expect(getPublicPage(p.path)?.locales).toEqual(['de'])
  })

  it('cite only known sources, number them in order and list every cited one', () => {
    for (const d of LAND_DRAFTS) {
      for (const t of draftTexts(d))
        for (const m of t.matchAll(/\[\^([a-z_]+)\]/g)) expect(LAND_SOURCES).toHaveProperty(m[1])
    }
    for (const p of LAND_PAGES) {
      const cited = new Set<number>()
      const texts = [
        ...p.intro,
        p.naechsteSchritte,
        ...[...p.termin, ...p.ferien, ...p.besonderheiten.blocks].flatMap((b) =>
          b.type === 'p' ? [b.text] : b.type === 'ul' || b.type === 'ol' ? b.items : []
        ),
        ...p.faqs.flatMap((f) => [f.question, f.answer]),
      ]
      for (const t of texts) for (const m of t.matchAll(/\[\^(\d+)\]/g)) cited.add(Number(m[1]))
      expect([...cited].sort((a, b) => a - b)).toEqual(p.sources.map((_, i) => i + 1))
      expect(p.sources.length).toBeGreaterThan(0)
      for (const s of p.sources) expect(s.url).toMatch(/^https:\/\//)
    }
  })

  it('link internally only to registered pages', () => {
    const registered = new Set(PUBLIC_PAGES.map((p) => p.path))
    const shared = [...LAND_COPY.nextSteps]
    for (const d of LAND_DRAFTS)
      for (const t of [...draftTexts(d), ...shared])
        for (const m of t.matchAll(/\]\((\/[^)\s]*)\)/g)) expect(registered).toContain(m[1])
  })

  it('every page has the date (or says honestly that there is none), the holidays and FAQs', () => {
    for (const p of LAND_PAGES) {
      expect(p.facts.zeugnis.length).toBeGreaterThan(5)
      expect(p.facts.ferien.length).toBeGreaterThan(5)
      expect(p.faqs.length).toBeGreaterThanOrEqual(2)
    }
    for (const slug of ['hamburg', 'mecklenburg-vorpommern']) {
      const p = LAND_PAGES.find((x) => x.slug === slug)!
      expect(p.facts.zeugnis).toMatch(/kein landesweiter Termin/)
      expect(draftTexts(p).join(' ')).toMatch(/Wann wird es bekannt\?/)
    }
  })

  it('is genuinely written per Land, not one template with the name swapped', () => {
    const sets = LAND_DRAFTS.map((d) => words(draftTexts(d)))
    for (let i = 0; i < sets.length; i++) {
      for (let j = i + 1; j < sets.length; j++) {
        const inter = [...sets[i]].filter((w) => sets[j].has(w)).length
        const jaccard = inter / (sets[i].size + sets[j].size - inter)
        expect(
          jaccard,
          `${LAND_DRAFTS[i].slug} vs ${LAND_DRAFTS[j].slug}: ${jaccard.toFixed(2)}`
        ).toBeLessThan(0.5)
      }
    }
  })

  it('the overview article links to all 16 pages from its table', () => {
    const overview = getRatgeberArticle('de', 'halbjahreszeugnis-bedeutung')!
    const table = overview.sections.flatMap((s) => s.blocks).find((b) => b.type === 'table')
    expect(table?.type).toBe('table')
    const firstColumn = table!.type === 'table' ? table!.rows.map((r) => r[0]).join(' ') : ''
    for (const p of LAND_PAGES) expect(firstColumn).toContain(`](${landPath(p.slug)})`)
  })
})
