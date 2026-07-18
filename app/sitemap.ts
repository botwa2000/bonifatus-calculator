import type { MetadataRoute } from 'next'
import { routing } from '@/i18n/routing'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bonifatus.com'
const { locales, defaultLocale } = routing

function buildUrl(locale: string, path: string): string {
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  // path is '/' or '/about' etc. — avoid double slash on root
  const normalized = path === '/' ? '' : path
  return `${BASE_URL}${prefix}${normalized || '/'}`
}

function alternates(path: string) {
  const languages: Record<string, string> = {}
  for (const locale of locales) {
    languages[locale] = buildUrl(locale, path)
  }
  languages['x-default'] = buildUrl(defaultLocale, path)
  return { languages }
}

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
    for (const locale of locales) {
      entries.push({
        url: buildUrl(locale, path),
        lastModified: now,
        changeFrequency,
        priority,
        alternates: alternates(path),
      })
    }
  }

  return entries
}
