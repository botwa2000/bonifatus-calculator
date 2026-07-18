export interface BlogPost {
  slug: string
  locale: string
  title: string
  description: string
  publishedAt: string
  readingTimeMinutes: number
  sections: BlogSection[]
  faqs?: Array<{ question: string; answer: string }>
}

export interface BlogSection {
  heading?: string
  body: string
}
