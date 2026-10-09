// Ratgeber (advice) articles. Text fields support a small inline markup, rendered by
// components/ratgeber/RichText.tsx:
//   **bold**   [link text](/internal/path or https://…)   [^n] → citation of sources[n-1]

export interface RatgeberMeta {
  slug: string
  locale: string
  /** H1 and <title> (the layout appends " | Bonifatus"). */
  title: string
  /** Meta description and the teaser on the hub page. */
  description: string
  publishedAt: string
  /** Date of the last material content change (YYYY-MM-DD). Drives sitemap <lastmod>. */
  updatedAt: string
  readingTimeMinutes: number
}

export type RatgeberBlock =
  | { type: 'p'; text: string }
  | { type: 'ul' | 'ol'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][]; note?: string }
  | { type: 'callout'; text: string }
  /** The DJI pocket-money table, rendered from lib/tools/allowance-table.ts. */
  | { type: 'djiAllowanceTable'; note?: string }
  /** The article's call to action (see RatgeberArticle.cta). */
  | { type: 'cta' }

export interface RatgeberSection {
  /** Anchor id for the table of contents. */
  id: string
  heading: string
  blocks: RatgeberBlock[]
}

export interface RatgeberSource {
  text: string
  url: string
}

export interface RatgeberArticle extends RatgeberMeta {
  intro: string[]
  sections: RatgeberSection[]
  cta: { title: string; text: string; button: string; href: '/tools/grade-reward-calculator' }
  faqs: Array<{ question: string; answer: string }>
  /** Numbered in order; cited in text as [^1], [^2], … */
  sources: RatgeberSource[]
  /** Slugs of related articles in the same locale. */
  related: string[]
}
