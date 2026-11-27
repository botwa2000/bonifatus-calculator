import type { RatgeberBlock, RatgeberSource } from '../types'
import type { LandSourceKey } from './sources'

/**
 * One Halbjahreszeugnis page per Land: /de/ratgeber/halbjahreszeugnis-<slug>.
 *
 * Text fields use the Ratgeber inline markup (components/ratgeber/RichText.tsx), but
 * citations name a source key instead of a number: `[^kmk]`. compileLand() in ./index.ts
 * numbers the keys in reading order, so every page lists exactly the sources it cites.
 */
export interface LandDraft {
  /** URL part after "halbjahreszeugnis-", e.g. "berlin". */
  slug: string
  name: string
  abbr: string
  /** Meta description, written for "halbjahreszeugnis <land> 2027". */
  description: string
  /** The two facts in the box at the top. */
  facts: { zeugnis: string; ferien: string }
  intro: string[]
  /** How the date comes about in this Land. */
  termin: RatgeberBlock[]
  /** Winterferien (or why there are none) and the holidays around the report. */
  ferien: RatgeberBlock[]
  /** What is particular about the Halbjahreszeugnis in this Land. */
  besonderheiten: { heading: string; blocks: RatgeberBlock[] }
  /** One sentence for "what parents do next", tied to this Land's calendar. */
  naechsteSchritte: string
  faqs: Array<{ question: string; answer: string }>
}

export interface LandPage extends Omit<LandDraft, 'facts'> {
  path: string
  title: string
  facts: { zeugnis: string; ferien: string }
  publishedAt: string
  updatedAt: string
  sources: RatgeberSource[]
  /** Source keys in citation order (tests check them against LAND_SOURCES). */
  sourceKeys: LandSourceKey[]
}
