import type { RatgeberBlock } from '../types'
import { LAND_DRAFTS } from './drafts'
import { LAND_SOURCES, type LandSourceKey } from './sources'
import type { LandDraft, LandPage } from './types'

export const LAND_LOCALE = 'de'
export const LAND_PUBLISHED = '2026-11-27'
export const LAND_UPDATED = '2026-11-27'
const PREFIX = 'halbjahreszeugnis-'

export const landPath = (slug: string) => `/ratgeber/${PREFIX}${slug}`

const CITE = /\[\^([a-z_]+)\]/g

function blockTexts(blocks: RatgeberBlock[]): string[] {
  return blocks.flatMap((b) =>
    b.type === 'p' || b.type === 'callout'
      ? [b.text]
      : b.type === 'ul' || b.type === 'ol'
        ? b.items
        : b.type === 'table'
          ? [...b.rows.flat(), b.note ?? '']
          : []
  )
}

/** Every text of a draft in reading order (citations are numbered in this order). */
export function draftTexts(d: LandDraft): string[] {
  return [
    ...d.intro,
    ...blockTexts(d.termin),
    ...blockTexts(d.ferien),
    ...blockTexts(d.besonderheiten.blocks),
    d.naechsteSchritte,
    ...d.faqs.flatMap((f) => [f.question, f.answer]),
  ]
}

function compileLand(d: LandDraft): LandPage {
  const keys: LandSourceKey[] = []
  for (const text of draftTexts(d)) {
    for (const m of text.matchAll(CITE)) {
      const key = m[1] as LandSourceKey
      if (!(key in LAND_SOURCES)) throw new Error(`${d.slug}: unknown source [^${key}]`)
      if (!keys.includes(key)) keys.push(key)
    }
  }
  const num = (t: string) => t.replace(CITE, (_, k) => `[^${keys.indexOf(k) + 1}]`)
  const blocks = (bs: RatgeberBlock[]): RatgeberBlock[] =>
    bs.map((b) =>
      b.type === 'p' || b.type === 'callout'
        ? { ...b, text: num(b.text) }
        : b.type === 'ul' || b.type === 'ol'
          ? { ...b, items: b.items.map(num) }
          : b
    )
  return {
    ...d,
    path: landPath(d.slug),
    title: `Halbjahreszeugnis ${d.name} 2027: Termin & Ferien`,
    intro: d.intro.map(num),
    termin: blocks(d.termin),
    ferien: blocks(d.ferien),
    besonderheiten: { ...d.besonderheiten, blocks: blocks(d.besonderheiten.blocks) },
    naechsteSchritte: num(d.naechsteSchritte),
    faqs: d.faqs.map((f) => ({ question: num(f.question), answer: num(f.answer) })),
    publishedAt: LAND_PUBLISHED,
    updatedAt: LAND_UPDATED,
    sourceKeys: keys,
    sources: keys.map((k) => LAND_SOURCES[k]),
  }
}

/** The 16 pages, alphabetical by Land. */
export const LAND_PAGES: readonly LandPage[] = LAND_DRAFTS.map(compileLand)

/** "/ratgeber/halbjahreszeugnis-berlin" → page; the route param is the part after /ratgeber/. */
export function getLandPageBySlug(routeSlug: string): LandPage | undefined {
  return routeSlug.startsWith(PREFIX)
    ? LAND_PAGES.find((p) => p.slug === routeSlug.slice(PREFIX.length))
    : undefined
}

export function getLandPage(slug: string): LandPage | undefined {
  return LAND_PAGES.find((p) => p.slug === slug)
}
