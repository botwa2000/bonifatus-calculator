export interface BlogPost {
  slug: string
  locale: string
  title: string
  description: string
  publishedAt: string
  /** Set when the content is materially revised after publication (YYYY-MM-DD). */
  updatedAt?: string
  readingTimeMinutes: number
  sections: BlogSection[]
  faqs?: Array<{ question: string; answer: string }>
}

export interface BlogSection {
  heading?: string
  body: string
}
