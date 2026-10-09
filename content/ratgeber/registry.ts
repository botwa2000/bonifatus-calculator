import type { RatgeberArticle, RatgeberMeta } from './types'
import { RATGEBER_INDEX, getRatgeberMeta } from './index'
import zeugnisgeld from './de/zeugnisgeld'
import taschengeldTabelle from './de/taschengeld-tabelle'
import schulnotenBelohnen from './de/schulnoten-belohnen'

export type RatgeberBody = Omit<RatgeberArticle, keyof RatgeberMeta>

const BODIES: Record<string, RatgeberBody> = {
  'de/zeugnisgeld': zeugnisgeld,
  'de/taschengeld-tabelle': taschengeldTabelle,
  'de/schulnoten-belohnen': schulnotenBelohnen,
}

export function getRatgeberArticle(locale: string, slug: string): RatgeberArticle | null {
  const meta = getRatgeberMeta(locale, slug)
  const body = BODIES[`${locale}/${slug}`]
  return meta && body ? { ...meta, ...body } : null
}

/** Every indexed article must have a body and vice versa (checked in tests). */
export function registryKeys() {
  return {
    indexed: RATGEBER_INDEX.map((a) => `${a.locale}/${a.slug}`).sort(),
    bodies: Object.keys(BODIES).sort(),
  }
}
