import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'
import { buildUrl, buildLanguages } from '@/lib/seo/alternates'

const routes: Array<{
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}> = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.5, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/tools', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/tools/grade-reward-calculator', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/tools/allowance-calculator', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/tools/investment-calculator', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'weekly' },
  {
    path: '/blog/should-you-pay-kids-for-good-grades',
    priority: 0.7,
    changeFrequency: 'monthly',
  },
  { path: '/compare', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/compare/apps-that-reward-good-grades', priority: 0.7, changeFrequency: 'monthly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const { path, priority, changeFrequency } of routes) {
    for (const locale of routing.locales) {
      entries.push({
        url: buildUrl(locale, path),
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: buildLanguages(path) },
      })
    }
  }

  return entries
}
